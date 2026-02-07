#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`AWS health monitoring`.run(async ({ $ }) => {
  const { execSync } = await import('node:child_process')

  const AWS_PROFILE = 'tamagui-prod'
  const AWS_REGION = 'us-west-1'

  interface TaskEvent {
    createdAt: string
    lastStatus: string
    stoppedReason?: string
    taskArn: string
  }

  function parseJson<T>(jsonString: string): T | null {
    try {
      return JSON.parse(jsonString)
    } catch {
      return null
    }
  }

  function run(command: string): string {
    try {
      const profilePrefix = AWS_PROFILE ? `AWS_PROFILE=${AWS_PROFILE} ` : ''
      return execSync(`${profilePrefix}${command}`, { encoding: 'utf-8', stdio: 'pipe' })
    } catch (error: any) {
      console.error(`Command failed: ${command}`)
      console.error(error.stderr || error.message)
      return ''
    }
  }

  async function findActiveClusters(): Promise<string[]> {
    try {
      // get all clusters
      const clustersJson = run(
        `aws ecs list-clusters --region ${AWS_REGION} --output json`
      )
      const clustersData = parseJson<any>(clustersJson)

      if (!clustersData?.clusterArns) return []

      // filter for start-dot-chat production clusters
      const productionClusters = clustersData.clusterArns
        .filter((arn: string) => arn.includes('start-dot-chat-production'))
        .map((arn: string) => arn.split('/').pop())

      // check which clusters have active services
      const activeClusters: string[] = []
      for (const clusterName of productionClusters) {
        const servicesJson = run(
          `aws ecs list-services --cluster ${clusterName} --region ${AWS_REGION} --output json`
        )
        const servicesData = parseJson<any>(servicesJson)

        if (servicesData?.serviceArns?.length > 0) {
          // check if any service has desired count > 0
          const serviceDetailsJson = run(
            `aws ecs describe-services --cluster ${clusterName} --services ${servicesData.serviceArns.join(' ')} --region ${AWS_REGION} --output json`
          )
          const serviceDetails = parseJson<any>(serviceDetailsJson)

          const hasActiveServices = serviceDetails?.services?.some(
            (s: any) => s.desiredCount > 0 || s.runningCount > 0
          )

          if (hasActiveServices) {
            activeClusters.push(clusterName)
          }
        }
      }

      return activeClusters
    } catch (error) {
      console.error('Failed to find active clusters:', error)
      return []
    }
  }

  async function checkServiceRestarts() {
    const clusters = await findActiveClusters()

    if (clusters.length === 0) {
      console.info('⚠️  No active clusters found')
      return
    }

    console.info(`📋 Monitoring clusters: ${clusters.join(', ')}\n`)

    for (const cluster of clusters) {
      try {
        // get services
        const services =
          await $`aws --profile ${AWS_PROFILE} --region ${AWS_REGION} ecs list-services --cluster ${cluster} --query 'serviceArns[]' --output json`.json()

        console.info(`Found ${services.length} services in cluster ${cluster}\n`)

        for (const serviceArn of services) {
          const serviceName = serviceArn.split('/').pop()

          // get service events
          const serviceInfo =
            await $`aws --profile ${AWS_PROFILE} --region ${AWS_REGION} ecs describe-services --cluster ${cluster} --services ${serviceName} --query 'services[0]' --output json`
              .quiet()
              .json()

          // check recent events
          const recentEvents = serviceInfo.events?.slice(0, 5) || []
          const hasRecentFailures = recentEvents.some(
            (e: any) =>
              e.message.includes('failed') ||
              e.message.includes('unhealthy') ||
              e.message.includes('stopped')
          )

          if (hasRecentFailures) {
            console.info(`⚠️  ${serviceName}: Recent failures detected`)
            for (const event of recentEvents.slice(0, 3)) {
              if (
                event.message.includes('failed') ||
                event.message.includes('unhealthy') ||
                event.message.includes('stopped')
              ) {
                console.info(
                  `   ${new Date(event.createdAt).toLocaleTimeString()}: ${event.message.substring(0, 100)}`
                )
              }
            }
          }

          // get stopped tasks in last hour
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

          try {
            const stoppedTasks =
              await $`aws --profile ${AWS_PROFILE} --region ${AWS_REGION} ecs list-tasks --cluster ${cluster} --service-name ${serviceName} --desired-status STOPPED --query 'taskArns[:10]' --output json`
                .quiet()
                .json()

            if (stoppedTasks.length > 0) {
              // get details of stopped tasks
              const taskDetails =
                await $`aws --profile ${AWS_PROFILE} --region ${AWS_REGION} ecs describe-tasks --cluster ${cluster} --tasks ${stoppedTasks.join(' ')} --query 'tasks[*].[createdAt,lastStatus,stoppedReason,taskArn]' --output json`
                  .quiet()
                  .json()

              // count restarts in last hour
              const recentRestarts = taskDetails.filter((task: any) => {
                const createdAt = new Date(task[0])
                return createdAt > new Date(oneHourAgo)
              })

              if (recentRestarts.length > 3) {
                console.info(
                  `🔄 ${serviceName}: ${recentRestarts.length} restarts in last hour`
                )
                // show stop reasons
                const stopReasons = new Map<string, number>()
                taskDetails.forEach((task: any) => {
                  const reason = task[2] || 'Unknown'
                  stopReasons.set(reason, (stopReasons.get(reason) || 0) + 1)
                })
                stopReasons.forEach((count, reason) => {
                  console.info(`   ${count}x ${reason}`)
                })
              } else if (recentRestarts.length > 0) {
                console.info(
                  `✅ ${serviceName}: ${recentRestarts.length} restart(s) in last hour (within normal range)`
                )
              } else {
                console.info(`✅ ${serviceName}: No restarts in last hour`)
              }
            }
          } catch (e) {
            // no stopped tasks
          }
        }
      } catch (error) {
        console.error(`  Error checking cluster ${cluster}:`, error)
      }
    }
  }

  async function checkLogIngestion() {
    const endTime = new Date().toISOString()
    const startTime = new Date(Date.now() - 60 * 60 * 1000).toISOString() // last hour

    // dynamically find log groups for active clusters
    const clusters = await findActiveClusters()
    const criticalLogGroups: string[] = []

    for (const cluster of clusters) {
      // find log groups for this cluster
      try {
        const logGroupsJson = run(
          `aws logs describe-log-groups --region ${AWS_REGION} --log-group-name-prefix "/sst/cluster/${cluster}" --output json`
        )
        const logGroupsData = parseJson<any>(logGroupsJson)

        if (logGroupsData?.logGroups) {
          for (const lg of logGroupsData.logGroups) {
            if (
              lg.logGroupName.includes('/WebApp/') ||
              lg.logGroupName.includes('/Zero')
            ) {
              criticalLogGroups.push(lg.logGroupName)
            }
          }
        }
      } catch {}
    }

    if (criticalLogGroups.length === 0) {
      console.info('⚠️  No log groups found to monitor')
      return
    }

    console.info(
      `\n📊 Checking log ingestion for ${criticalLogGroups.length} log groups...`
    )

    for (const logGroup of criticalLogGroups) {
      try {
        const stats =
          await $`aws --profile ${AWS_PROFILE} --region ${AWS_REGION} cloudwatch get-metric-statistics --namespace AWS/Logs --metric-name IncomingBytes --dimensions Name=LogGroupName,Value="${logGroup}" --start-time ${startTime} --end-time ${endTime} --period 3600 --statistics Sum --query 'Datapoints[0].Sum' --output text`
            .quiet()
            .text()

        const bytes = parseFloat(stats.trim()) || 0
        const mb = bytes / 1048576

        if (mb > 1000) {
          // alert if more than 1GB/hour
          console.info(
            `📊 High log ingestion: ${logGroup.split('/').pop()} - ${(mb / 1024).toFixed(2)}GB/hour`
          )
        } else if (mb > 100) {
          console.info(
            `📊 Log ingestion: ${logGroup.split('/').pop()} - ${mb.toFixed(0)}MB/hour`
          )
        } else if (mb > 0) {
          console.info(
            `📊 Log ingestion: ${logGroup.split('/').pop()} - ${mb.toFixed(1)}MB/hour`
          )
        }
      } catch (e) {}
    }
  }

  async function suggestActions() {
    console.info('\n✅ Health monitoring complete')
  }

  await checkServiceRestarts()
  await checkLogIngestion()
  await suggestActions()
})
