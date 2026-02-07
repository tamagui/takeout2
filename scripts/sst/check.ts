#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`SST deployment health check`.args('--verbose boolean').run(async ({ args }) => {
  const { execSync } = await import('node:child_process')

  interface ServiceStatus {
    name: string
    taskDefinition: string
    desiredCount: number
    runningCount: number
    pendingCount: number
    deployments: Array<{
      status: string
      taskDefinition: string
      desiredCount: number
      runningCount: number
      pendingCount: number
      rolloutState?: string
      rolloutStateReason?: string
    }>
    events: Array<{
      createdAt: string
      message: string
    }>
    stoppedTasks?: Array<{
      taskArn: string
      stoppedReason?: string
      stoppedAt?: string
      containerLogs?: string[]
    }>
  }

  interface AuroraStatus {
    clusterId: string
    status: string
    engineMode?: string
    serverlessV2ScalingConfiguration?: {
      minCapacity: number
      maxCapacity: number
    }
    capacity?: number
    instances: Array<{
      instanceId: string
      status: string
      instanceClass?: string
      endpoint?: string
      role: string
    }>
  }

  interface DeploymentReport {
    success: boolean
    services: ServiceStatus[]
    aurora?: AuroraStatus
    issues: string[]
  }

  const REGION = 'us-west-1'
  const PROFILE = 'tamagui-prod'
  const MAX_WAIT_TIME = 1000 * 60 * 15
  const CHECK_INTERVAL = 5 * 1000 // check every 5 seconds for faster completion
  const STATUS_LOG_INTERVAL = 60 * 1000
  const VERBOSE_LOG_INTERVAL = 30 * 1000 // show logs every 30 seconds in verbose mode

  // these will be populated from SST state
  let CLUSTER_NAME = ''
  let SERVICES_TO_CHECK: string[] = []
  let AURORA_CLUSTER_ID = ''

  const VERBOSE_MODE = args.verbose

  function run(command: string): string {
    try {
      const profilePrefix = PROFILE ? `AWS_PROFILE=${PROFILE} ` : ''
      return execSync(`${profilePrefix}${command}`, { encoding: 'utf-8', stdio: 'pipe' })
    } catch (error: any) {
      console.error(`Command failed: ${command}`)
      console.error(error.stderr || error.message)
      return ''
    }
  }

  function getSstState(): Record<string, any> {
    try {
      // get SST state
      const stateJson = execSync('bun sst state export --stage production', {
        encoding: 'utf-8',
        stdio: 'pipe',
      })

      const state = JSON.parse(stateJson)

      // find cluster and services from state
      const resources: Record<string, any> = {}

      // parse the state to find our resources
      for (const [key, value] of Object.entries(state)) {
        // look for Cluster resource
        if (key.includes('Cluster') && value && typeof value === 'object') {
          const v = value as any
          if (v.type === 'sst:aws:Cluster') {
            // extract cluster ID from the properties
            if (v.properties?.cluster) {
              // the cluster ID is in the ARN, extract it
              const arnMatch = v.properties.cluster.match(/cluster\/([^/]+)$/)
              if (arnMatch) {
                resources.cluster = arnMatch[1]
              }
            } else if (v.id) {
              resources.cluster = v.id
            }
          }
        }

        // look for Service resources - they have type 'sst:aws:Service'
        if (
          value &&
          typeof value === 'object' &&
          (value as any).type === 'sst:aws:Service'
        ) {
          const v = value as any
          // the service name is usually the key without the resource prefix
          const serviceName = key.replace(/^.*\./, '')
          if (v.properties?.service) {
            // extract service name from ARN
            const serviceMatch = v.properties.service.match(/service\/[^/]+\/([^/]+)$/)
            if (serviceMatch) {
              resources[serviceName] = serviceMatch[1]
            }
          } else if (v.name) {
            resources[serviceName] = v.name
          } else {
            // use the key as the service name
            resources[serviceName] = serviceName
          }
        }

        // look for Aurora resources
        if (key.includes('Postgres') && value && typeof value === 'object') {
          const v = value as any
          if (v.type === 'sst:aws:Aurora' && v.properties?.clusterIdentifier) {
            resources.aurora = v.properties.clusterIdentifier
          }
        }
      }

      return resources
    } catch (error) {
      console.error('Failed to get SST state:', error)
      // fallback to dynamically finding the cluster
      try {
        const clustersJson = execSync(
          `AWS_PROFILE=${PROFILE} aws ecs list-clusters --region ${REGION} --output json`,
          { encoding: 'utf-8', stdio: 'pipe' }
        )
        const clusters = JSON.parse(clustersJson)
        const clusterArn = clusters.clusterArns?.find((arn: string) =>
          arn.includes('start-dot-chat-production')
        )
        if (clusterArn) {
          const clusterName = clusterArn.split('/').pop()
          return {
            cluster: clusterName,
            WebApp: 'WebApp',
            Zero4: 'Zero4',
            ZeroReplication4: 'ZeroReplication4',
          }
        }
      } catch (err) {
        console.error('Failed to dynamically find cluster:', err)
      }

      // final fallback
      return {
        cluster: 'start-dot-chat-production-ClusterCluster-xueztkfw',
        WebApp: 'WebApp',
        Zero4: 'Zero4',
        ZeroReplication4: 'ZeroReplication4',
      }
    }
  }

  function initializeFromSstState() {
    const state = getSstState()

    // debug: show what we found
    if (process.env.DEBUG) {
      console.info('Debug - SST State found:', JSON.stringify(state, null, 2))
    }

    // set cluster name - first try from state
    CLUSTER_NAME = state.cluster

    // if not found in state, find the active cluster dynamically
    if (!CLUSTER_NAME) {
      try {
        const clustersJson = run(`aws ecs list-clusters --region ${REGION} --output json`)
        const clusters = parseJson<any>(clustersJson)

        // find start-dot-chat production cluster
        const clusterArns =
          clusters?.clusterArns?.filter((arn: string) =>
            arn.includes('start-dot-chat-production')
          ) || []

        // check which cluster has active services
        for (const clusterArn of clusterArns) {
          const clusterName = clusterArn.split('/').pop()
          const servicesJson = run(
            `aws ecs list-services --cluster ${clusterName} --region ${REGION} --output json`
          )
          const servicesData = parseJson<any>(servicesJson)

          if (servicesData?.serviceArns?.length > 0) {
            // check if any service has desired count > 0
            const serviceDetailsJson = run(
              `aws ecs describe-services --cluster ${clusterName} --services ${servicesData.serviceArns.join(' ')} --region ${REGION} --output json`
            )
            const serviceDetails = parseJson<any>(serviceDetailsJson)

            const hasActiveServices = serviceDetails?.services?.some(
              (s: any) => s.desiredCount > 0 || s.runningCount > 0
            )

            if (hasActiveServices) {
              CLUSTER_NAME = clusterName
              if (VERBOSE_MODE) {
                console.info(`🔍 Found active cluster: ${CLUSTER_NAME}`)
              }
              break
            }
          }
        }

        // if still not found, use the most recently created cluster
        if (!CLUSTER_NAME && clusterArns.length > 0) {
          CLUSTER_NAME = clusterArns[clusterArns.length - 1].split('/').pop()
          console.info(`⚠️  Using most recent cluster: ${CLUSTER_NAME}`)
        }
      } catch (error) {
        console.error('Failed to find active cluster:', error)
      }
    }

    // final fallback
    if (!CLUSTER_NAME) {
      CLUSTER_NAME = 'start-dot-chat-production-ClusterCluster-xueztkfw'
      console.info(`⚠️  Using fallback cluster: ${CLUSTER_NAME}`)
    }

    // get service names - map to actual service names from state
    const serviceMapping: Record<string, string> = {}
    const expectedServices = ['WebApp', 'Zero4', 'ZeroReplication4']

    for (const key of Object.keys(state)) {
      if (expectedServices.includes(key)) {
        serviceMapping[key] = state[key] || key
      }
    }

    // if we didn't find services in state, use the service names directly
    if (Object.keys(serviceMapping).length === 0) {
      for (const serviceName of expectedServices) {
        serviceMapping[serviceName] = serviceName
      }
    }

    SERVICES_TO_CHECK = Object.values(serviceMapping)

    // set Aurora cluster ID from state
    if (state.aurora) {
      AURORA_CLUSTER_ID = state.aurora
    } else {
      // try to find Aurora cluster dynamically
      try {
        const clustersJson = run(
          `aws rds describe-db-clusters --region ${REGION} --output json`
        )
        const clusters = parseJson<any>(clustersJson)
        const auroraCluster = clusters?.DBClusters?.find((cluster: any) =>
          cluster.DBClusterIdentifier.includes('start-dot-chat-production')
        )
        if (auroraCluster) {
          AURORA_CLUSTER_ID = auroraCluster.DBClusterIdentifier
        }
      } catch (error) {
        console.info('⚠️  Could not find Aurora cluster')
      }
    }

    if (VERBOSE_MODE) {
      console.info(`📋 Using cluster: ${CLUSTER_NAME}`)
      console.info(`📋 Checking services: ${SERVICES_TO_CHECK.join(', ')}`)
      if (AURORA_CLUSTER_ID) {
        console.info(`📋 Checking Aurora: ${AURORA_CLUSTER_ID}`)
      }
      console.info('')
    }
  }

  function parseJson<T>(jsonString: string): T | null {
    try {
      return JSON.parse(jsonString)
    } catch {
      return null
    }
  }

  async function checkTargetGroupHealth(serviceName: string, loadBalancers: any[]) {
    console.info(`   Checking target group health for ${serviceName}...`)

    for (const lb of loadBalancers) {
      const targetGroupArn = lb.targetGroupArn
      if (!targetGroupArn) continue

      // get target health
      const healthJson = run(
        `aws elbv2 describe-target-health --target-group-arn ${targetGroupArn} --region ${REGION} --output json`
      )

      const healthData = parseJson<any>(healthJson)
      if (!healthData?.TargetHealthDescriptions) continue

      const targets = healthData.TargetHealthDescriptions
      console.info(`   Target group has ${targets.length} registered targets:`)

      for (const target of targets) {
        const id = target.Target?.Id
        const state = target.TargetHealth?.State
        const reason = target.TargetHealth?.Reason
        const description = target.TargetHealth?.Description

        const icon = state === 'healthy' ? '✅' : state === 'unhealthy' ? '❌' : '⏳'
        console.info(`     ${icon} ${id}: ${state}`)

        if (reason && reason !== 'Target.ResponseCodeMismatch') {
          console.info(`        Reason: ${reason}`)
        }
        if (description && state !== 'healthy') {
          console.info(`        Details: ${description}`)
          // extract health check failure codes if present
          const codeMatch = description.match(/codes: \[(\d+)\]/)
          if (codeMatch) {
            const code = codeMatch[1]
            if (code === '302') {
              console.info(
                `        ⚠️  302 redirect - app is redirecting the health check path`
              )
              console.info(
                `        💡 Fix: Check middleware auth rules or configure correct health path`
              )
            } else if (code === '404') {
              console.info(`        ⚠️  404 not found - health endpoint doesn't exist`)
            } else if (code === '500' || code === '502' || code === '503') {
              console.info(`        ⚠️  ${code} server error - app may be crashing`)
            }
          }
        }

        // if unhealthy, try to get more details about the task
        if (state === 'unhealthy' || state === 'draining') {
          // extract task id from the target id (format: ip:port:ecs-task-id)
          const parts = id?.split(':')
          if (parts?.length >= 3) {
            const taskId = parts[2]

            // get task details
            const taskJson = run(
              `aws ecs describe-tasks --cluster ${CLUSTER_NAME} --tasks ${taskId} --region ${REGION} --output json 2>/dev/null || echo '{}'`
            )
            const taskData = parseJson<any>(taskJson)

            if (taskData?.tasks?.[0]) {
              const task = taskData.tasks[0]
              const taskDef = task.taskDefinitionArn?.split('/').pop()
              const lastStatus = task.lastStatus
              const desiredStatus = task.desiredStatus
              const stoppedReason = task.stoppedReason

              console.info(`        Task: ${taskId.substring(0, 8)}... (${taskDef})`)
              console.info(`        Status: ${lastStatus} (desired: ${desiredStatus})`)

              if (stoppedReason) {
                console.info(`        Stopped: ${stoppedReason}`)
              }
            }
          }
        }
      }

      // check target group health check configuration
      const targetGroupJson = run(
        `aws elbv2 describe-target-groups --target-group-arns ${targetGroupArn} --region ${REGION} --output json`
      )

      const targetGroupData = parseJson<any>(targetGroupJson)
      if (targetGroupData?.TargetGroups?.[0]) {
        const tg = targetGroupData.TargetGroups[0]
        console.info(`   Target group health check settings:`)
        console.info(`     Path: ${tg.HealthCheckPath || '/'}`)
        console.info(`     Protocol: ${tg.HealthCheckProtocol}`)
        console.info(`     Matcher: ${tg.Matcher?.HttpCode || '200'}`)
        console.info(`     Interval: ${tg.HealthCheckIntervalSeconds}s`)
        console.info(`     Timeout: ${tg.HealthCheckTimeoutSeconds}s`)
        console.info(`     Healthy threshold: ${tg.HealthyThresholdCount}`)
        console.info(`     Unhealthy threshold: ${tg.UnhealthyThresholdCount}`)
      }

      // get deregistration delay from attributes
      const attributesJson = run(
        `aws elbv2 describe-target-group-attributes --target-group-arn ${targetGroupArn} --region ${REGION} --output json`
      )

      const attributesData = parseJson<any>(attributesJson)
      if (attributesData?.Attributes) {
        const deregDelay = attributesData.Attributes.find(
          (a: any) => a.Key === 'deregistration_delay.timeout_seconds'
        )?.Value
        if (deregDelay) {
          console.info(`     Deregistration delay: ${deregDelay}s`)
        }
      }
    }
  }

  async function getServiceStatus(serviceName: string): Promise<ServiceStatus | null> {
    const serviceJson = run(
      `aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${serviceName} --region ${REGION} --output json`
    )

    const serviceData = parseJson<any>(serviceJson)
    if (!serviceData?.services?.[0]) return null

    const service = serviceData.services[0]

    // log detailed deployment info in verbose mode for debugging
    if (VERBOSE_MODE && service.deployments?.length > 1) {
      const primaryDeployment = service.deployments.find(
        (d: any) => d.status === 'PRIMARY'
      )
      const activeDeployment = service.deployments.find((d: any) => d.status === 'ACTIVE')

      // ACTIVE is the old deployment being phased out, PRIMARY is the new one
      if (
        primaryDeployment &&
        primaryDeployment.runningCount < primaryDeployment.desiredCount
      ) {
        console.info(
          `\n⚠️  ${serviceName}: New deployment struggling - ${primaryDeployment.runningCount}/${primaryDeployment.desiredCount} tasks running`
        )
        console.info(`   Health checks may be failing for the new deployment`)

        // get the task definition to check health check configuration
        const taskDefJson = run(
          `aws ecs describe-task-definition --task-definition ${activeDeployment.taskDefinition} --region ${REGION} --output json`
        )
        const taskDefData = parseJson<any>(taskDefJson)

        if (taskDefData?.taskDefinition) {
          const healthCheck =
            taskDefData.taskDefinition.containerDefinitions?.[0]?.healthCheck
          if (healthCheck) {
            console.info(
              `   Health check command: ${JSON.stringify(healthCheck.command)}`
            )
            console.info(
              `   Health check interval: ${healthCheck.interval}s, timeout: ${healthCheck.timeout}s`
            )
            console.info(
              `   Retries: ${healthCheck.retries}, start period: ${healthCheck.startPeriod}s`
            )
          } else {
            console.info(
              `   No container health check configured (using load balancer health checks)`
            )
          }
        }

        // check target group health if using load balancer
        if (service.loadBalancers?.length > 0) {
          await checkTargetGroupHealth(serviceName, service.loadBalancers)
        }
      }
    }

    // get recent events
    const events =
      service.events?.slice(0, 10).map((e: any) => ({
        createdAt: e.createdAt,
        message: e.message,
      })) || []

    // get deployment info
    const deployments =
      service.deployments?.map((d: any) => ({
        status: d.status,
        taskDefinition: d.taskDefinition.split('/').pop(),
        desiredCount: d.desiredCount,
        runningCount: d.runningCount,
        pendingCount: d.pendingCount,
        rolloutState: d.rolloutState,
        rolloutStateReason: d.rolloutStateReason,
      })) || []

    // check for recently stopped tasks
    const stoppedTasksJson = run(
      `aws ecs list-tasks --cluster ${CLUSTER_NAME} --service-name ${serviceName} --desired-status STOPPED --region ${REGION} --output json`
    )

    const stoppedTasksData = parseJson<any>(stoppedTasksJson)
    const stoppedTasks: ServiceStatus['stoppedTasks'] = []

    if (stoppedTasksData?.taskArns?.length > 0) {
      // get details of stopped tasks (last 3)
      const recentStoppedArns = stoppedTasksData.taskArns.slice(0, 3)
      for (const taskArn of recentStoppedArns) {
        const taskJson = run(
          `aws ecs describe-tasks --cluster ${CLUSTER_NAME} --tasks ${taskArn} --region ${REGION} --output json`
        )
        const taskData = parseJson<any>(taskJson)
        if (taskData?.tasks?.[0]) {
          const task = taskData.tasks[0]
          const taskId = taskArn.split('/').pop()

          // try to get logs for the stopped task
          const containerLogs = await getTaskLogs(serviceName, taskId, 50)

          stoppedTasks.push({
            taskArn: taskId,
            stoppedReason: task.stoppedReason,
            stoppedAt: task.stoppedAt,
            containerLogs,
          })
        }
      }
    }

    return {
      name: serviceName,
      taskDefinition: service.taskDefinition.split('/').pop(),
      desiredCount: service.desiredCount,
      runningCount: service.runningCount,
      pendingCount: service.pendingCount,
      deployments,
      events,
      stoppedTasks: stoppedTasks.length > 0 ? stoppedTasks : undefined,
    }
  }

  async function getTaskLogs(
    serviceName: string,
    taskId: string,
    lines: number = 50
  ): Promise<string[]> {
    // dynamically discover the log group for this service
    const logGroupsJson = run(
      `aws logs describe-log-groups --region ${REGION} --log-group-name-prefix "/sst/cluster/${CLUSTER_NAME}" --output json`
    )

    const logGroupsData = parseJson<any>(logGroupsJson)
    if (!logGroupsData?.logGroups) return []

    // find log group that contains the service name
    const logGroup = logGroupsData.logGroups.find((lg: any) =>
      lg.logGroupName.includes(serviceName)
    )

    if (!logGroup) {
      // fallback: try to find any log group for this cluster
      const fallbackGroup = logGroupsData.logGroups[0]
      if (!fallbackGroup) return []
    }

    const logGroupName =
      logGroup?.logGroupName || logGroupsData.logGroups[0]?.logGroupName
    const logStreamPrefix = `/service/${serviceName}/${taskId.split('-')[0]}`

    // first, find the log stream
    const streamsJson = run(
      `aws logs describe-log-streams --log-group-name ${logGroupName} --log-stream-name-prefix "${logStreamPrefix}" --region ${REGION} --output json --max-items 1`
    )

    const streamsData = parseJson<any>(streamsJson)
    if (!streamsData?.logStreams?.[0]) {
      // try without the prefix if exact match fails
      const allStreamsJson = run(
        `aws logs describe-log-streams --log-group-name ${logGroupName} --region ${REGION} --output json --order-by LastEventTime --descending --max-items 5`
      )
      const allStreamsData = parseJson<any>(allStreamsJson)
      if (!allStreamsData?.logStreams?.[0]) return []

      // find a stream that contains the task id
      const matchingStream =
        allStreamsData.logStreams.find((s: any) =>
          s.logStreamName.includes(taskId.split('-')[0])
        ) || allStreamsData.logStreams[0]

      if (!matchingStream) return []
      const streamName = matchingStream.logStreamName

      // get logs from the stream
      const logsJson = run(
        `aws logs get-log-events --log-group-name ${logGroupName} --log-stream-name "${streamName}" --region ${REGION} --output json --limit ${lines}`
      )

      const logsData = parseJson<any>(logsJson)
      return logsData?.events?.map((e: any) => e.message) || []
    }

    const streamName = streamsData.logStreams[0].logStreamName

    // get logs from the stream
    const logsJson = run(
      `aws logs get-log-events --log-group-name ${logGroupName} --log-stream-name "${streamName}" --region ${REGION} --output json --limit ${lines}`
    )

    const logsData = parseJson<any>(logsJson)
    return logsData?.events?.map((e: any) => e.message) || []
  }

  async function getAuroraStatus(): Promise<AuroraStatus | null> {
    if (!AURORA_CLUSTER_ID) return null

    try {
      const clusterJson = run(
        `aws rds describe-db-clusters --db-cluster-identifier ${AURORA_CLUSTER_ID} --region ${REGION} --output json`
      )

      const clusterData = parseJson<any>(clusterJson)
      if (!clusterData?.DBClusters?.[0]) return null

      const cluster = clusterData.DBClusters[0]

      // get instance details
      const instances =
        cluster.DBClusterMembers?.map((member: any) => {
          // get detailed instance info
          const instanceJson = run(
            `aws rds describe-db-instances --db-instance-identifier ${member.DBInstanceIdentifier} --region ${REGION} --output json`
          )
          const instanceData = parseJson<any>(instanceJson)
          const instance = instanceData?.DBInstances?.[0]

          return {
            instanceId: member.DBInstanceIdentifier,
            status: instance?.DBInstanceStatus || 'unknown',
            instanceClass: instance?.DBInstanceClass,
            endpoint: instance?.Endpoint?.Address,
            role: member.IsClusterWriter ? 'writer' : 'reader',
          }
        }) || []

      return {
        clusterId: cluster.DBClusterIdentifier,
        status: cluster.Status,
        engineMode: cluster.EngineMode,
        serverlessV2ScalingConfiguration: cluster.ServerlessV2ScalingConfiguration
          ? {
              minCapacity: cluster.ServerlessV2ScalingConfiguration.MinCapacity,
              maxCapacity: cluster.ServerlessV2ScalingConfiguration.MaxCapacity,
            }
          : undefined,
        capacity: cluster.Capacity,
        instances,
      }
    } catch (error) {
      console.error('Failed to get Aurora status:', error)
      return null
    }
  }

  async function getRunningTaskLogs(
    serviceName: string,
    lines: number = 5
  ): Promise<string[]> {
    // get the service details to find running tasks
    const serviceJson = run(
      `aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${serviceName} --region ${REGION} --output json`
    )

    const serviceData = parseJson<any>(serviceJson)
    if (!serviceData?.services?.[0]) return []

    const service = serviceData.services[0]

    // get the latest deployment's task definition - prefer PRIMARY (new) over ACTIVE (old being phased out)
    const primaryDeployment = service.deployments?.find(
      (d: any) => d.status === 'PRIMARY'
    )
    const activeDeployment = service.deployments?.find((d: any) => d.status === 'ACTIVE')

    // during deployment: PRIMARY is the new one we want logs from
    // after deployment: only PRIMARY exists
    const latestDeployment = primaryDeployment || activeDeployment

    if (!latestDeployment) return []

    // list ALL tasks for this service (including stopped ones recently)
    const allTasksJson = run(
      `aws ecs list-tasks --cluster ${CLUSTER_NAME} --service-name ${serviceName} --region ${REGION} --output json`
    )

    const allTasksData = parseJson<any>(allTasksJson)

    // also check recently stopped tasks for the new deployment
    const stoppedTasksJson = run(
      `aws ecs list-tasks --cluster ${CLUSTER_NAME} --service-name ${serviceName} --desired-status STOPPED --max-items 5 --region ${REGION} --output json`
    )

    const stoppedTasksData = parseJson<any>(stoppedTasksJson)
    const allTaskArns = [
      ...(allTasksData?.taskArns || []),
      ...(stoppedTasksData?.taskArns || []),
    ]

    if (!allTaskArns.length) return ['[No tasks found for service]']

    // get details of all tasks
    const taskDetailsJson = run(
      `aws ecs describe-tasks --cluster ${CLUSTER_NAME} --tasks ${allTaskArns.join(' ')} --region ${REGION} --output json`
    )

    const taskDetailsData = parseJson<any>(taskDetailsJson)
    if (!taskDetailsData?.tasks?.length) return []

    // find a task that matches the latest deployment's task definition
    const newDeploymentTask = taskDetailsData.tasks.find(
      (task: any) => task.taskDefinitionArn === latestDeployment.taskDefinition
    )

    if (!newDeploymentTask) {
      // if we're looking for a PRIMARY deployment but can't find its task, it might not have started yet
      if (primaryDeployment && primaryDeployment.desiredCount === 0) {
        return ['[New deployment has 0 desired tasks - likely failing health checks]']
      }
      // if the new deployment just hasn't started a task yet
      if (primaryDeployment && primaryDeployment.runningCount === 0) {
        return ['[New deployment starting - no tasks running yet]']
      }
      // try to get logs from any running task as fallback
      const anyRunningTask = taskDetailsData.tasks.find(
        (t: any) => t.lastStatus === 'RUNNING'
      )
      if (anyRunningTask) {
        const taskId = anyRunningTask.taskArn.split('/').pop()
        const logs = await getTaskLogs(serviceName, taskId, lines)
        return logs.length > 0
          ? ['[From old deployment - new task not found]', ...logs]
          : []
      }
      return ['[No logs - new task not yet started or already stopped]']
    }

    const taskId = newDeploymentTask.taskArn.split('/').pop()
    const taskStatus = newDeploymentTask.lastStatus
    const logs = await getTaskLogs(serviceName, taskId, lines)

    if (logs.length === 0 && taskStatus === 'STOPPED') {
      return [`[Task ${taskId.substring(0, 8)}... stopped - no logs captured]`]
    }

    return logs.length > 0 ? logs : ['[Task started but no logs yet]']
  }

  async function waitForDeploymentStability(
    timeout: number = MAX_WAIT_TIME
  ): Promise<DeploymentReport> {
    if (VERBOSE_MODE) {
      console.info('🔍 Checking deployment status...\n')
      console.info('📢 Verbose mode enabled - will show logs periodically\n')
    } else {
      console.info('🔍 Monitoring deployment...\n')
    }

    const startTime = Date.now()
    const issues: string[] = []
    let lastStatus: ServiceStatus[] = []
    let lastAuroraStatus: AuroraStatus | null = null
    let logCheckCounter = 0
    let lastStateChangeTime = Date.now()
    let lastOverviewTime = Date.now() - STATUS_LOG_INTERVAL // force initial overview
    let lastVerboseLogTime = Date.now()
    let previousServiceStates = new Map<string, string>()
    let previousAuroraState = ''
    let isFirstCheck = true

    // track initial task definitions to detect new deployments
    const initialTaskDefs = new Map<string, string>()

    // track previous logs to avoid repeating them
    const previousLogs = new Map<string, string>()

    // helper function to check if deployment is complete
    const checkDeploymentComplete = () => {
      const healthyServices = lastStatus.filter(
        (s) => s.runningCount === s.desiredCount && s.runningCount > 0
      )
      const allServicesHealthy = healthyServices.length === lastStatus.length
      const hasNoFailedDeployments = !lastStatus.some((s) =>
        s.deployments.some((d) => d.rolloutState === 'FAILED' || d.status === 'FAILED')
      )
      const hasNoActiveDeployments = !lastStatus.some((s) => s.deployments.length > 1)
      const auroraHealthy = !lastAuroraStatus || lastAuroraStatus.status === 'available'

      return {
        isComplete:
          allServicesHealthy &&
          auroraHealthy &&
          hasNoActiveDeployments &&
          hasNoFailedDeployments &&
          issues.length === 0,
        healthyServices,
        allServicesHealthy,
        auroraHealthy,
        hasNoActiveDeployments,
        hasNoFailedDeployments,
      }
    }

    // helper function to return success result
    const returnSuccess = (healthyServices: ServiceStatus[]) => {
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000)
      console.info(`\n✅ [${elapsedSeconds}s] All services are healthy and stable!`)
      console.info(
        `✅ ${healthyServices.length}/${lastStatus.length} services running successfully`
      )
      if (lastAuroraStatus && lastAuroraStatus.status === 'available') {
        console.info(`✅ Aurora cluster is available`)
      }
      console.info('\n🎉 Deployment verification complete - exiting immediately\n')
      return {
        success: true,
        services: lastStatus,
        aurora: lastAuroraStatus || undefined,
        issues,
      }
    }

    // show initial status and capture initial task definitions
    if (isFirstCheck) {
      const initialStatuses: ServiceStatus[] = []
      for (const serviceName of SERVICES_TO_CHECK) {
        const status = await getServiceStatus(serviceName)
        if (status) {
          initialStatuses.push(status)
          // store the newest deployment's task definition as our baseline
          const newestDeploy = status.deployments[0] // deployments are ordered newest first
          if (newestDeploy) {
            initialTaskDefs.set(serviceName, newestDeploy.taskDefinition)
          }
        }
      }

      if (!VERBOSE_MODE) {
        console.info('📊 Initial Status:')
        for (const service of initialStatuses) {
          const icon =
            service.runningCount === service.desiredCount && service.runningCount > 0
              ? '✅'
              : '⏳'
          console.info(
            `  ${icon} ${service.name}: ${service.runningCount}/${service.desiredCount} tasks`
          )
        }

        const auroraStatus = await getAuroraStatus()
        if (auroraStatus) {
          const auroraIcon = auroraStatus.status === 'available' ? '✅' : '⏳'
          console.info(`  ${auroraIcon} Aurora: ${auroraStatus.status}`)
        }
        console.info('')
      }
    }

    while (Date.now() - startTime < timeout) {
      const services: ServiceStatus[] = []
      let hasActiveDeployments = false
      const serviceProblems: string[] = []

      // check Aurora status first
      const auroraStatus = await getAuroraStatus()
      lastAuroraStatus = auroraStatus

      let auroraHealthy = true
      if (auroraStatus) {
        if (auroraStatus.status !== 'available') {
          auroraHealthy = false
          serviceProblems.push(`Aurora: ${auroraStatus.status}`)
        }

        // check if all instances are available
        const unhealthyInstances = auroraStatus.instances.filter(
          (i) => i.status !== 'available'
        )
        if (unhealthyInstances.length > 0) {
          auroraHealthy = false
          unhealthyInstances.forEach((i) => {
            serviceProblems.push(`Aurora instance ${i.instanceId}: ${i.status}`)
          })
        }
      }

      await Promise.all(
        SERVICES_TO_CHECK.map(async (serviceName) => {
          const status = await getServiceStatus(serviceName)
          if (!status) {
            issues.push(`❌ Could not get status for service: ${serviceName}`)
            return
          }

          services.push(status)

          // check if service is healthy
          const isHealthy =
            status.runningCount === status.desiredCount && status.runningCount > 0
          const hasMultipleDeployments = status.deployments.length > 1
          const hasFailedDeployment = status.deployments.some(
            (d) => d.rolloutState === 'FAILED' || d.status === 'FAILED'
          )

          if (hasMultipleDeployments) {
            hasActiveDeployments = true
          }

          if (hasFailedDeployment) {
            issues.push(`❌ Service ${serviceName} has a failed deployment`)
            serviceProblems.push(`${serviceName}: failed deployment`)
          }

          if (!isHealthy) {
            if (status.runningCount === 0 && status.desiredCount > 0) {
              serviceProblems.push(
                `${serviceName}: no tasks running (0/${status.desiredCount})`
              )
            }
          }

          // check for exec format errors or other critical issues
          if (status.stoppedTasks) {
            for (const task of status.stoppedTasks) {
              if (task.stoppedReason?.includes('Essential container in task exited')) {
                const hasExecError = task.containerLogs?.some((log) =>
                  log.includes('Exec format error')
                )
                if (hasExecError) {
                  issues.push(
                    `❌ Service ${serviceName} has exec format error (architecture mismatch)`
                  )
                  serviceProblems.push(`${serviceName}: architecture mismatch`)

                  // immediately show logs for failed service
                  console.info(`\n🚨 Service ${serviceName} failed - showing logs:`)
                  console.info('-'.repeat(60))
                  if (task.containerLogs) {
                    for (const log of task.containerLogs) {
                      const trimmedLog = log.trim()
                      if (trimmedLog) {
                        console.info(`   ${trimmedLog}`)
                      }
                    }
                  }
                  console.info('-'.repeat(60))
                }
              }
            }
          }
        })
      )

      lastStatus = services

      // check if a newer deployment has started (someone pushed while we were checking)
      for (const service of services) {
        const initialTaskDef = initialTaskDefs.get(service.name)
        if (initialTaskDef) {
          const newestDeploy = service.deployments[0] // deployments are ordered newest first
          if (newestDeploy && newestDeploy.taskDefinition !== initialTaskDef) {
            // a newer deployment has started!
            const initialVersion = initialTaskDef.split(':').pop()
            const newVersion = newestDeploy.taskDefinition.split(':').pop()
            console.info('\n🚀 New deployment detected!')
            console.info(`  ${service.name}: v${initialVersion} → v${newVersion}`)
            console.info(
              '  Another deployment was started - exiting in favor of the newer one.\n'
            )
            console.info(
              '✅ Current deployment appears stable, deferring to new deployment.\n'
            )

            // return success since the current state is likely stable enough for a new deploy
            return {
              success: true,
              services: lastStatus,
              aurora: lastAuroraStatus || undefined,
              issues: [`New deployment started for ${service.name}`],
            }
          }
        }
      }

      // check for state changes
      const stateChanges: string[] = []

      // check each service for state changes
      for (const service of services) {
        const currentState = `${service.name}:${service.runningCount}/${service.desiredCount}:${service.deployments.length}`
        const previousState = previousServiceStates.get(service.name)

        if (previousState && previousState !== currentState) {
          const wasRunning = previousState.split(':')[1]?.split('/')[0]
          const nowRunning = service.runningCount.toString()
          const deploymentCount = service.deployments.length

          if (deploymentCount > 1) {
            stateChanges.push(
              `🔄 ${service.name}: rolling update progress - ${service.runningCount}/${service.desiredCount} tasks`
            )
          } else if (wasRunning !== nowRunning) {
            const icon = service.runningCount > Number(wasRunning) ? '↗️' : '↘️'
            stateChanges.push(
              `${icon} ${service.name}: task count changed from ${wasRunning} to ${service.runningCount}`
            )
          }
        }
        previousServiceStates.set(service.name, currentState)
      }

      // check aurora state changes
      if (auroraStatus) {
        const currentAuroraState = `${auroraStatus.status}:${auroraStatus.instances.map((i) => i.status).join(',')}`
        if (previousAuroraState && previousAuroraState !== currentAuroraState) {
          stateChanges.push(
            `🗄️ Aurora: ${auroraStatus.status} (instances: ${auroraStatus.instances.map((i) => `${i.role}:${i.status}`).join(', ')})`
          )
        }
        previousAuroraState = currentAuroraState
      }

      // log state changes immediately
      if (stateChanges.length > 0) {
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000)
        console.info(`⏱️  [${elapsedSeconds}s] State changes detected:`)
        for (const change of stateChanges) {
          console.info(`  ${change}`)
        }
        console.info('')
        lastStateChangeTime = Date.now()
      }

      // check for completion after collecting all statuses
      const completionCheck = checkDeploymentComplete()
      if (completionCheck.isComplete) {
        return returnSuccess(completionCheck.healthyServices)
      }

      // show simple progress in non-verbose mode
      if (!VERBOSE_MODE && Date.now() - lastStateChangeTime > 30000) {
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000)
        const healthyCount = lastStatus.filter(
          (s) => s.runningCount === s.desiredCount && s.runningCount > 0
        ).length
        const deployingCount = lastStatus.filter((s) => s.deployments.length > 1).length

        if (deployingCount > 0) {
          console.info(
            `⏳ [${elapsedSeconds}s] ${healthyCount}/${lastStatus.length} services healthy, ${deployingCount} still updating...`
          )
        } else {
          console.info(
            `⏳ [${elapsedSeconds}s] ${healthyCount}/${lastStatus.length} services healthy, finalizing...`
          )
        }
        lastStateChangeTime = Date.now()
      }

      // check if we should log no-change status
      const timeSinceLastChange = Date.now() - lastStateChangeTime
      const timeSinceLastOverview = Date.now() - lastOverviewTime

      // if no change for 1 minute, log status
      if (
        timeSinceLastChange >= STATUS_LOG_INTERVAL &&
        stateChanges.length === 0 &&
        !isFirstCheck
      ) {
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000)
        console.info(`⏱️  [${elapsedSeconds}s] No state changes in the last minute`)
        lastStateChangeTime = Date.now()
      }

      // log complete overview every minute or on first check (in verbose mode)
      if (
        VERBOSE_MODE &&
        (timeSinceLastOverview >= STATUS_LOG_INTERVAL || isFirstCheck)
      ) {
        lastOverviewTime = Date.now()

        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000)
        logCheckCounter++
        if (isFirstCheck) {
          console.info(`📊 Initial Status:`)
        } else {
          console.info(`\n📊 [${elapsedSeconds}s] Status Overview:`)
        }
        console.info('─'.repeat(60))

        // show problems if any
        if (serviceProblems.length > 0) {
          console.info(`⚠️  Problems: ${serviceProblems.join(', ')}`)
        }

        for (const service of services) {
          const status = service.runningCount === service.desiredCount ? '✅' : '⏳'
          console.info(
            `${status} ${service.name}: ${service.runningCount}/${service.desiredCount} tasks running`
          )

          if (service.deployments.length > 1) {
            const primaryDeploy = service.deployments.find((d) => d.status === 'PRIMARY')
            const activeDeploy = service.deployments.find((d) => d.status === 'ACTIVE')
            if (activeDeploy) {
              console.info(
                `   📦 Active deployment: ${activeDeploy.runningCount}/${activeDeploy.desiredCount} tasks`
              )
              if (activeDeploy.rolloutState) {
                console.info(`   🔄 Rollout state: ${activeDeploy.rolloutState}`)
              }
              if (activeDeploy.rolloutStateReason) {
                console.info(`   ℹ️  Reason: ${activeDeploy.rolloutStateReason}`)
              }
            }
            if (primaryDeploy && activeDeploy) {
              console.info(`   🔄 Rolling update in progress...`)
              if (primaryDeploy.rolloutState) {
                console.info(`   📌 Primary state: ${primaryDeploy.rolloutState}`)
              }
            }
          }

          // show recent events for unhealthy services or services with multiple deployments
          if (
            (service.runningCount === 0 || service.deployments.length > 1) &&
            service.events.length > 0
          ) {
            const recentEvent = service.events[0]
            if (recentEvent) {
              const eventTime = new Date(recentEvent.createdAt).toLocaleTimeString()
              const message =
                recentEvent.message.length > 100
                  ? recentEvent.message.substring(0, 100) + '...'
                  : recentEvent.message
              console.info(`   📝 Last event [${eventTime}]: ${message}`)
            }

            // show more events if deployment is stuck
            if (service.deployments.length > 1 && VERBOSE_MODE) {
              console.info(`   Recent deployment events:`)
              for (const event of service.events.slice(1, 4)) {
                const eventTime = new Date(event.createdAt).toLocaleTimeString()
                const msg =
                  event.message.length > 80
                    ? event.message.substring(0, 80) + '...'
                    : event.message
                console.info(`     [${eventTime}] ${msg}`)
              }
            }
          }
        }

        // show Aurora status
        if (auroraStatus) {
          const auroraIcon = auroraStatus.status === 'available' ? '✅' : '⏳'
          console.info(`${auroraIcon} Aurora: ${auroraStatus.status}`)

          if (auroraStatus.serverlessV2ScalingConfiguration) {
            console.info(
              `   📊 Scaling: ${auroraStatus.serverlessV2ScalingConfiguration.minCapacity}-${auroraStatus.serverlessV2ScalingConfiguration.maxCapacity} ACU`
            )
          }

          for (const instance of auroraStatus.instances) {
            const instanceIcon = instance.status === 'available' ? '✅' : '⏳'
            console.info(
              `   ${instanceIcon} ${instance.role}: ${instance.instanceId} (${instance.status})`
            )
          }
        }

        console.info('─'.repeat(60))
        console.info('')

        // check for completion immediately after logging status overview
        const afterOverviewCheck = checkDeploymentComplete()
        if (afterOverviewCheck.isComplete) {
          return returnSuccess(afterOverviewCheck.healthyServices)
        }
      }

      // show logs: every 30s in verbose mode, every 5 minutes in non-verbose mode (only if there are issues)
      const LOG_SHOW_INTERVAL = VERBOSE_MODE
        ? VERBOSE_LOG_INTERVAL
        : STATUS_LOG_INTERVAL * 5 // 5 minutes in non-verbose mode
      const timeSinceLastVerboseLog = Date.now() - lastVerboseLogTime
      const shouldShowLogs = VERBOSE_MODE
        ? timeSinceLastVerboseLog >= LOG_SHOW_INTERVAL
        : timeSinceLastVerboseLog >= LOG_SHOW_INTERVAL &&
          hasActiveDeployments &&
          serviceProblems.length > 0

      if (shouldShowLogs) {
        lastVerboseLogTime = Date.now()
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000)
        console.info(`\n📄 [${elapsedSeconds}s] Latest logs from deployment tasks:`)
        console.info('-'.repeat(60))

        for (const service of services) {
          // only show logs for services with deployment issues
          if (service.deployments.length > 1 || service.runningCount === 0) {
            try {
              let logs: string[] = []

              // try to get logs from running tasks first
              if (service.runningCount > 0) {
                logs = await getRunningTaskLogs(service.name, 5)
              }

              // if no running tasks or no logs, try to get logs from stopped tasks
              if (
                logs.length === 0 &&
                service.stoppedTasks &&
                service.stoppedTasks.length > 0
              ) {
                // get logs from the most recently stopped task
                const recentStoppedTask = service.stoppedTasks[0]
                if (recentStoppedTask) {
                  if (
                    recentStoppedTask.containerLogs &&
                    recentStoppedTask.containerLogs.length > 0
                  ) {
                    logs = recentStoppedTask.containerLogs.slice(-5)
                    console.info(
                      `\n🔹 ${service.name} (from stopped task ${recentStoppedTask.taskArn}):`
                    )
                  }
                }
              } else if (logs.length > 0) {
                console.info(`\n🔹 ${service.name}:`)
              }

              if (logs.length > 0) {
                // check if logs have changed since last time
                const logString = logs.join('\n')
                const previousLogString = previousLogs.get(service.name) || ''

                if (logString !== previousLogString) {
                  // logs have changed, show them
                  previousLogs.set(service.name, logString)
                  for (const log of logs) {
                    const trimmedLog = log.trim()
                    if (trimmedLog) {
                      console.info(`   ${trimmedLog}`)
                    }
                  }
                } else {
                  // logs haven't changed, skip showing them
                  console.info(`   [Logs unchanged]`)
                }
              } else if (service.runningCount === 0) {
                console.info(`\n🔹 ${service.name}: No logs available (no running tasks)`)
              }
            } catch (error) {
              // silently skip log errors
            }
          }
        }
        console.info('-'.repeat(60))
        console.info('')
      }

      // mark first check as complete
      if (isFirstCheck) {
        isFirstCheck = false
      }

      // final check before waiting for next iteration
      const finalCheck = checkDeploymentComplete()
      if (finalCheck.isComplete) {
        return returnSuccess(finalCheck.healthyServices)
      }

      // wait before next check
      await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL))
    }

    // timeout reached - show logs for all services before returning
    console.info('\n❌ Deployment timeout - showing latest logs for debugging:')
    console.info('='.repeat(80))

    for (const service of lastStatus) {
      console.info(
        `\n🔹 ${service.name} (${service.runningCount}/${service.desiredCount} tasks):`
      )
      console.info('-'.repeat(60))

      try {
        // try to get logs from running tasks
        if (service.runningCount > 0) {
          const logs = await getRunningTaskLogs(service.name, 50)
          if (logs.length > 0) {
            console.info('Latest running task logs:')
            for (const log of logs) {
              const trimmedLog = log.trim()
              if (trimmedLog) {
                console.info(`   ${trimmedLog}`)
              }
            }
          }
        }

        // show logs from stopped tasks if any
        if (service.stoppedTasks && service.stoppedTasks.length > 0) {
          for (const stoppedTask of service.stoppedTasks.slice(0, 2)) {
            console.info(`\nStopped task ${stoppedTask.taskArn}:`)
            if (stoppedTask.stoppedReason) {
              console.info(`   Reason: ${stoppedTask.stoppedReason}`)
            }
            if (stoppedTask.containerLogs && stoppedTask.containerLogs.length > 0) {
              console.info('   Last logs:')
              for (const log of stoppedTask.containerLogs.slice(-30)) {
                const trimmedLog = log.trim()
                if (trimmedLog) {
                  console.info(`     ${trimmedLog}`)
                }
              }
            }
          }
        }

        // show recent events
        if (service.events && service.events.length > 0) {
          console.info('\nRecent events:')
          for (const event of service.events.slice(0, 5)) {
            const time = new Date(event.createdAt).toLocaleTimeString()
            console.info(`   [${time}] ${event.message}`)
          }
        }
      } catch (error) {
        console.info(`   Failed to retrieve logs: ${error}`)
      }
    }

    console.info('\n' + '='.repeat(80))
    issues.push(`⏱️  Deployment did not stabilize within ${timeout / 1000} seconds`)

    return {
      success: false,
      services: lastStatus,
      aurora: lastAuroraStatus || undefined,
      issues,
    }
  }

  function printDetailedReport(report: DeploymentReport) {
    console.info('='.repeat(80))
    console.info('📊 DEPLOYMENT REPORT')
    console.info('='.repeat(80))

    for (const service of report.services) {
      console.info(`\n📦 Service: ${service.name}`)
      console.info(`   Task Definition: ${service.taskDefinition}`)
      console.info(
        `   Status: ${service.runningCount}/${service.desiredCount} tasks running`
      )

      if (service.deployments.length > 0) {
        console.info(`   Deployments:`)
        for (const deployment of service.deployments) {
          const marker = deployment.status === 'PRIMARY' ? '→' : ' '
          console.info(
            `     ${marker} ${deployment.status}: ${deployment.runningCount}/${deployment.desiredCount} (${deployment.taskDefinition})`
          )
          if (deployment.rolloutState) {
            console.info(`        Rollout: ${deployment.rolloutState}`)
          }
          if (deployment.rolloutStateReason) {
            console.info(`        Reason: ${deployment.rolloutStateReason}`)
          }
        }
      }

      if (service.events.length > 0) {
        console.info(`   Recent Events:`)
        for (const event of service.events.slice(0, 3)) {
          const time = new Date(event.createdAt).toLocaleTimeString()
          console.info(`     [${time}] ${event.message}`)
        }
      }

      if (service.stoppedTasks && service.stoppedTasks.length > 0) {
        console.info(`   ⚠️  Recently Stopped Tasks:`)
        for (const task of service.stoppedTasks) {
          console.info(`     Task ${task.taskArn}: ${task.stoppedReason}`)
          if (task.containerLogs && task.containerLogs.length > 0) {
            console.info(`     Last logs:`)
            for (const log of task.containerLogs.slice(-45)) {
              console.info(`       ${log.trim()}`)
            }
          }
        }
      }
    }

    // aurora report
    if (report.aurora) {
      console.info(`\n🗄️  Aurora Cluster: ${report.aurora.clusterId}`)
      console.info(`   Status: ${report.aurora.status}`)

      if (report.aurora.serverlessV2ScalingConfiguration) {
        console.info(
          `   Scaling: ${report.aurora.serverlessV2ScalingConfiguration.minCapacity}-${report.aurora.serverlessV2ScalingConfiguration.maxCapacity} ACU`
        )
      }

      if (report.aurora.instances.length > 0) {
        console.info(`   Instances:`)
        for (const instance of report.aurora.instances) {
          console.info(
            `     ${instance.role === 'writer' ? '✍️' : '📖'} ${instance.instanceId}: ${instance.status}`
          )
          if (instance.endpoint) {
            console.info(`        Endpoint: ${instance.endpoint}`)
          }
        }
      }
    }

    if (report.issues.length > 0) {
      console.info(`\n⚠️  Issues Detected:`)
      for (const issue of report.issues) {
        console.info(`   ${issue}`)
      }
    }

    console.info('\n' + '='.repeat(80))
  }

  async function checkInitialStatus() {
    if (!VERBOSE_MODE) return // skip initial status in non-verbose mode

    console.info('\n🔍 Checking deployment configuration...\n')

    // check task definition images in parallel
    const checkPromises = SERVICES_TO_CHECK.map(async (serviceName) => {
      const serviceJson = run(
        `aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${serviceName} --region ${REGION} --output json`
      )

      const serviceData = parseJson<any>(serviceJson)
      if (!serviceData?.services?.[0]) return null

      const taskDefArn = serviceData.services[0].taskDefinition
      const taskDefJson = run(
        `aws ecs describe-task-definition --task-definition ${taskDefArn} --region ${REGION} --output json`
      )

      const taskDefData = parseJson<any>(taskDefJson)
      if (taskDefData?.taskDefinition?.containerDefinitions?.[0]) {
        const image = taskDefData.taskDefinition.containerDefinitions[0].image
        const cpu = taskDefData.taskDefinition.cpu
        const memory = taskDefData.taskDefinition.memory
        const arch =
          taskDefData.taskDefinition.runtimePlatform?.cpuArchitecture || 'default'

        return {
          serviceName,
          image,
          cpu: Number(cpu) / 1024,
          memory: Number(memory),
          arch,
        }
      }
      return null
    })

    const results = await Promise.all(checkPromises)

    console.info('📦 Service Configurations:')
    for (const result of results) {
      if (result) {
        console.info(`  ${result.serviceName}:`)
        console.info(`   Image: ${result.image}`)
        console.info(`   Resources: ${result.cpu} vCPU, ${result.memory}MB Memory`)
        console.info(`   Architecture: ${result.arch}`)
      }
    }

    // check Aurora status
    if (AURORA_CLUSTER_ID) {
      const auroraStatus = await getAuroraStatus()
      if (auroraStatus) {
        console.info(`\n🗄️  Aurora Configuration:`)
        console.info(`  Cluster: ${auroraStatus.clusterId}`)
        console.info(`  Status: ${auroraStatus.status}`)
        if (auroraStatus.serverlessV2ScalingConfiguration) {
          console.info(
            `  Scaling: ${auroraStatus.serverlessV2ScalingConfiguration.minCapacity}-${auroraStatus.serverlessV2ScalingConfiguration.maxCapacity} ACU`
          )
        }
        if (auroraStatus.instances.length > 0) {
          console.info(
            `  Instances: ${auroraStatus.instances.length} (${auroraStatus.instances.map((i) => i.role).join(', ')})`
          )
        }
      }
    }

    console.info('')
  }

  if (VERBOSE_MODE) {
    console.info('🚀 Deployment Health Check\n')
  }

  // initialize from SST state
  initializeFromSstState()

  // fail if no services are configured
  if (SERVICES_TO_CHECK.length === 0) {
    console.error('❌ No services found to check! SST state may be misconfigured.')
    process.exit(1)
  }

  // first check current configuration
  await checkInitialStatus()

  // wait for deployment to stabilize
  const report = await waitForDeploymentStability()

  // print detailed report
  printDetailedReport(report)

  // fail if no services were actually found
  if (report.services.length === 0) {
    console.error('\n❌ No services were found in the cluster!')
    process.exit(1)
  }

  // exit with appropriate code
  if (!report.success) {
    console.error('\n❌ Deployment health check failed!')
    process.exit(1)
  } else {
    console.info('\n✅ Deployment health check passed!')
    process.exit(0)
  }
})
