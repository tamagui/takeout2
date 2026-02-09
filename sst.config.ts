/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  async app(input) {
    const { APP_NAME_LOWERCASE } = await import('./src/constants/app')

    return {
      name: APP_NAME_LOWERCASE,
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        cloudflare: '6.2.0',
        aws: {
          region: 'us-west-1',
          profile: input.stage === 'production' ? 'tamagui-prod' : 'tamagui-dev',
        },
        command: '1.0.2',
      },
    }
  },

  async run() {
    const { execSync } = await import('node:child_process')
    const { loadEnv } = await import('@take-out/scripts/helpers/env-load')
    const { DOMAIN } = await import('./src/constants/app')
    const stage = $dev ? 'development' : 'production'

    const { ONE_SERVER_URL } = process.env
    if (!ONE_SERVER_URL) {
      throw new Error(`Missing ONE_SERVER_URL`)
    }
    if (stage === 'production' && ONE_SERVER_URL.includes('localhost')) {
      throw new Error(`Invalid ONE_SERVER_URL for production: ${ONE_SERVER_URL}`)
    }

    console.info(`ONE_SERVER_URL ${ONE_SERVER_URL}`)

    const serverEnv = {
      ...(await loadEnv(stage, {
        optional: ['ZERO_UPSTREAM_DB'],
      })),
      ONE_SERVER_URL,
    }

    const zeroVersion = process.env.ZERO_VERSION

    if (!zeroVersion) {
      throw new Error(`No zero version found — run: bun tko run generate-env`)
    }

    const domain = DOMAIN

    // Zero Backup
    const replicationBucket = new sst.aws.Bucket(`ZeroReplicationBucket4`, {
      public: false,
    })

    // VPC Configuration
    const vpc = new sst.aws.Vpc(`VPC`, {
      // allows tunnel into the vpc, about ~$3/mo ec2 micro
      bastion: true,
      // allows lambda functions
      // bug https://github.com/sst/sst/issues/5657
      nat: 'ec2',
    })

    // ECS Cluster
    const cluster = new sst.aws.Cluster(`Cluster`, {
      vpc,
      transform: {
        cluster: {
          settings: [
            {
              name: 'containerInsights',
              value: 'enhanced',
            },
          ],
        },
      },
    })

    // Postgres
    const database = new sst.aws.Aurora(`Postgres2`, {
      vpc,
      engine: 'postgres',
      database: 'postgres',
      version: '16.8',
      scaling: {
        min: '0 ACU',
        max: '4 ACU',
      },
      transform: {
        cluster: {
          backupRetentionPeriod: 7,
          preferredBackupWindow: '03:00-04:00',
          deletionProtection: true,
          finalSnapshotIdentifier: $interpolate`${$app.name}-${$app.stage}-postgres-final-${Date.now()}`,
        },
        clusterParameterGroup: {
          parameters: [
            {
              name: 'rds.logical_replication',
              value: '1',
              applyMethod: 'pending-reboot',
            },
            {
              name: 'max_slot_wal_keep_size',
              value: '10240',
              applyMethod: 'pending-reboot',
            },
            {
              name: 'log_statement',
              value: 'ddl',
              applyMethod: 'pending-reboot',
            },
            {
              name: 'log_min_duration_statement',
              value: '1000',
              applyMethod: 'pending-reboot',
            },
            {
              name: 'max_connections',
              value: '100',
              applyMethod: 'pending-reboot',
            },
            {
              name: 'idle_session_timeout',
              value: '35000',
              applyMethod: 'pending-reboot',
            },
            {
              name: 'shared_preload_libraries',
              value: 'pg_stat_statements',
              applyMethod: 'pending-reboot',
            },
          ],
        },
      },
    })

    const pgConnectString = $interpolate`postgres://${database.username}:${database.password}@${database.host}:${database.port}`
    const pgDefaultDBConnectString = $interpolate`${pgConnectString}/${database.database}`

    const dbEnv = {
      ZERO_UPSTREAM_DB: pgDefaultDBConnectString,
      ZERO_CVR_DB: $interpolate`${pgConnectString}/zero_cvr`,
      ZERO_CHANGE_DB: $interpolate`${pgConnectString}/zero_change`,
    }

    // Shared Environment
    const commonEnv = {
      ...serverEnv,
      ...dbEnv,
      BETTER_AUTH_URL: `https://${DOMAIN}`,
      ZERO_LITESTREAM_BACKUP_URL: $interpolate`s3://${replicationBucket.name}/backup`,
      GIT_SHA: execSync('git rev-parse HEAD').toString().trim(),
    }

    const gitSha = execSync(`git rev-parse HEAD`).toString()

    const image = process.env.WEB_APP_DOCKER_IMAGE
    console.info(`web app image:`, image)

    // web app
    const webApp = new sst.aws.Service(`WebApp`, {
      cluster,
      image: image || {
        context: '.',
      },
      architecture: 'arm64',
      cpu: '4 vCPU',
      memory: '8 GB',
      capacity: 'spot',
      link: [database],
      scaling: {
        min: 1,
        max: 1,
      },
      environment: {
        ...commonEnv,
        GIT_SHA: gitSha,
        NODE_OPTIONS: '--max-old-space-size=6144',
      },
      health: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8081/api/health || exit 1'],
        interval: '10 seconds',
        retries: 8,
        startPeriod: '300 seconds',
      },
      logging: {
        retention: '2 weeks',
      },
      serviceRegistry: {
        port: 8081,
      },
      loadBalancer: {
        public: true,
        health: {
          '8081/http': {
            path: '/api/health',
            interval: '10 seconds',
          },
        },
        domain: $dev
          ? undefined
          : {
              name: domain,
              dns: sst.cloudflare.dns(),
            },
        rules: [
          {
            listen: '80/http',
            forward: '8081/http',
          },
          ...(!$dev
            ? ([
                {
                  listen: '443/https',
                  forward: '8081/http',
                },
              ] as const)
            : []),
        ],
      },
    })

    // job runner
    // TODO
    // const jobRunner = $dev
    //   ? null
    //   : new sst.aws.Service(`JobRunner`, {
    //       cluster,
    //       image: image || {
    //         context: '.',
    //       },
    //       cpu: '0.5 vCPU',
    //       memory: '1 GB',
    //       capacity: 'spot',
    //       architecture: 'arm64',
    //       link: [database],
    //       environment: {
    //         ...commonEnv,
    //         NODE_ENV: 'production',
    //       },
    //       dev: {
    //         command: 'bun run src/jobs/index.ts',
    //       },
    //       scaling: {
    //         min: 1,
    //         max: 1,
    //       },
    //       logging: {
    //         retention: '2 weeks',
    //       },
    //       transform: {
    //         taskDefinition: (args) => {
    //           args.containerDefinitions = args.containerDefinitions?.map((container) => ({
    //             ...container,
    //             command: ['bun', 'run', 'src/jobs/index.ts'],
    //           }))
    //         },
    //       },
    //     })

    const zeroEnv = {
      ...commonEnv,
      ZERO_LOG_FORMAT: 'json',
      ZERO_REPLICA_FILE: 'sync-replica.db',
      ZERO_MUTATE_URL: $interpolate`${webApp.url}api/zero/push`,
      ZERO_QUERY_URL: $interpolate`${webApp.url}api/zero/pull`,
      // getting  received unexpected error = request to http://169.254.169.254/computeMetadata/v1/instance failed, reason: connect EINVAL
      // due to zero telemtry gcp-metadata
      DO_NOT_TRACK: '1',
    }

    $resolve([webApp.url]).apply(([url]) => {
      console.info(`Web app internal URL: ${url}`)
      // this is https://${DOMAIN} in production
    })

    const zeroReplication = $dev
      ? null
      : new sst.aws.Service(`ZeroReplication4`, {
          cluster,
          image: `rocicorp/zero:${zeroVersion}`,
          cpu: '4 vCPU',
          memory: '8 GB',
          capacity: 'spot',
          architecture: 'arm64',
          link: [database, replicationBucket],
          health: {
            command: ['CMD-SHELL', 'curl -f http://localhost:4849/ || exit 1'],
            interval: '10 seconds',
            retries: 10,
            startPeriod: '300 seconds',
          },
          environment: {
            ...zeroEnv,
            ZERO_INITIAL_SYNC_PROFILE_COPY: 'true',
            ZERO_CHANGE_MAX_CONNS: '3',
            ZERO_NUM_SYNC_WORKERS: '0',
          },
          scaling: {
            min: 1,
            max: 1,
          },
          logging: {
            retention: '2 weeks',
          },
          serviceRegistry: {
            port: 4849,
          },
          transform: {
            service: {
              deploymentMinimumHealthyPercent: 100,
              deploymentMaximumPercent: 200,
            },
          },
        })

    if (!zeroReplication) {
      throw new Error(`No replication?`)
    }

    /**
     * Zero: Note that you can't just change Zero4 => Zero5 to force re-create it.
     * It doesn't destroy 4 before creating 5 which causes Cloudflare to error due to
     * attempting to set duplicate CNAME entries. I imagine you'd have to just remove
     * the Zero instances somehow and then re-deploy them.
     */

    // View Syncer Service
    const viewSyncer = new sst.aws.Service(
      `Zero4`,
      {
        cluster,
        image: `rocicorp/zero:${zeroVersion}`,
        cpu: '4 vCPU',
        memory: '8 GB',
        capacity: 'spot',
        architecture: 'arm64',
        link: [database, replicationBucket],
        health: {
          command: ['CMD-SHELL', 'curl -f http://localhost:4848/ || exit 1'],
          interval: '10 seconds',
          retries: 10,
          startPeriod: '300 seconds',
          timeout: '10 seconds',
        },
        environment: {
          ...zeroEnv,
          ZERO_UPSTREAM_MAX_CONNS: '15',
          ZERO_CVR_MAX_CONNS: '160',
          ZERO_CHANGE_STREAMER_MODE: 'discover',
        },
        scaling: {
          min: 1,
          max: 5,
        },
        logging: {
          retention: '2 weeks',
        },
        loadBalancer: {
          public: true,
          domain: $dev
            ? undefined
            : {
                name: `zero.${domain}`,
                dns: sst.cloudflare.dns(),
              },
          rules: [
            {
              listen: '80/http',
              forward: '4848/http',
            },
            ...(!$dev
              ? ([
                  {
                    listen: '443/https',
                    forward: '4848/http',
                  },
                ] as const)
              : []),
          ],
        },
        serviceRegistry: {
          port: 4848,
        },
        transform: {
          service: {
            deploymentMinimumHealthyPercent: 100,
            deploymentMaximumPercent: 200,
          },
          target: {
            stickiness: {
              enabled: true,
              type: 'lb_cookie',
              cookieDuration: 120,
            },
            loadBalancingAlgorithmType: 'least_outstanding_requests',
          },
          autoScalingTarget: {
            minCapacity: 1,
            maxCapacity: 3,
          },
        },
      },
      {
        // Wait for replication-manager to come up first, for breaking changes
        // to replication-manager interface.
        dependsOn: [zeroReplication],
      }
    )

    // lambda can't access AWS_ stuff for some reason so remove it:
    const {
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      // lets also remove this huge key we dont need for migrations, lambda 4kb limit
      CHAT_GITHUB_APP_PRIVATE_KEY,
      ...lambdaEnv
    } = commonEnv

    const migrator = new sst.aws.Function('PostgresMigrator', {
      vpc,
      // trying to make it wait for zero
      link: [database, viewSyncer],
      handler: 'src/database/migrate-dist.main',
      runtime: 'nodejs22.x',
      environment: {
        ...lambdaEnv,
        CHAT_GITHUB_APP_PRIVATE_KEY: '', // avoid undefined error
      },
      timeout: `900 seconds`,
    })

    new aws.lambda.Invocation('PostgresMigratorInvocation', {
      input: Date.now().toString(),
      functionName: migrator.name,
    })
  },
})
