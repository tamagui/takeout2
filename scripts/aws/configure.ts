#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`AWS CloudWatch configuration`
  .args('--clear-logs boolean --dry-run boolean')
  .run(async ({ args, $ }) => {
    const { clearLogs, dryRun } = args

    // configuration
    const AWS_PROFILE = 'tamagui-prod'
    const AWS_REGION = 'us-west-1'
    const DEFAULT_RETENTION_DAYS = 7
    const CRITICAL_RETENTION_DAYS = 30
    const PERFORMANCE_RETENTION_DAYS = 3
    const BILLING_ALARM_THRESHOLD = 50
    const LOG_INGESTION_ALARM_THRESHOLD_GB = 10 // alert if more than 10GB/day

    async function getLogGroups() {
      const result =
        await $`aws --profile ${AWS_PROFILE} --region ${AWS_REGION} logs describe-log-groups --query 'logGroups[*].[logGroupName,retentionInDays,storedBytes]' --output json`.json()
      return result
    }

    async function deleteLogGroup(logGroupName: string) {
      if (dryRun) {
        return
      }

      try {
        await $`aws --profile ${AWS_PROFILE} --region ${AWS_REGION} logs delete-log-group --log-group-name ${logGroupName}`.quiet()
      } catch (error) {}
    }

    async function createLogGroup(logGroupName: string) {
      if (dryRun) {
        return
      }

      try {
        await $`aws --profile ${AWS_PROFILE} --region ${AWS_REGION} logs create-log-group --log-group-name ${logGroupName}`.quiet()
      } catch (error) {}
    }

    async function setRetentionPolicy(logGroupName: string, days: number) {
      if (dryRun) {
        return
      }

      try {
        await $`aws --profile ${AWS_PROFILE} --region ${AWS_REGION} logs put-retention-policy --log-group-name ${logGroupName} --retention-in-days ${days}`.quiet()
      } catch (error) {}
    }

    async function setupBillingAlarms() {
      // cloudwatch specific alarm
      try {
        await $`aws --profile ${AWS_PROFILE} --region us-east-1 cloudwatch put-metric-alarm --alarm-name "CloudWatch-Daily-Cost-Alert" --alarm-description "Alert when CloudWatch costs exceed ${BILLING_ALARM_THRESHOLD}/day" --metric-name EstimatedCharges --namespace AWS/Billing --statistic Maximum --period 86400 --threshold ${BILLING_ALARM_THRESHOLD} --comparison-operator GreaterThanThreshold --dimensions Name=Currency,Value=USD Name=ServiceName,Value=AmazonCloudWatch --evaluation-periods 1 --treat-missing-data notBreaching`.quiet()
      } catch {}

      // total AWS bill alarm
      try {
        await $`aws --profile ${AWS_PROFILE} --region us-east-1 cloudwatch put-metric-alarm --alarm-name "AWS-Total-Daily-Cost-Alert" --alarm-description "Alert when total AWS costs exceed 500/day" --metric-name EstimatedCharges --namespace AWS/Billing --statistic Maximum --period 86400 --threshold 500 --comparison-operator GreaterThanThreshold --dimensions Name=Currency,Value=USD --evaluation-periods 1 --treat-missing-data notBreaching`.quiet()
      } catch {}
    }

    async function setupLogIngestionAlarm() {
      const thresholdBytes = LOG_INGESTION_ALARM_THRESHOLD_GB * 1073741824

      try {
        await $`aws --profile ${AWS_PROFILE} --region ${AWS_REGION} cloudwatch put-metric-alarm --alarm-name "CloudWatch-High-Log-Ingestion" --alarm-description "Alert when log ingestion exceeds ${LOG_INGESTION_ALARM_THRESHOLD_GB}GB/day" --metric-name IncomingBytes --namespace AWS/Logs --statistic Sum --period 86400 --threshold ${thresholdBytes} --comparison-operator GreaterThanThreshold --evaluation-periods 1 --treat-missing-data notBreaching`.quiet()
      } catch {}
    }

    function getRetentionDays(logGroupName: string): number {
      if (logGroupName.includes('/WebApp/') || logGroupName.includes('/Zero')) {
        return DEFAULT_RETENTION_DAYS
      } else if (logGroupName.includes('PostgresMigrator')) {
        return CRITICAL_RETENTION_DAYS
      } else if (
        logGroupName.includes('/performance') ||
        logGroupName.includes('containerinsights')
      ) {
        return PERFORMANCE_RETENTION_DAYS
      }
      return DEFAULT_RETENTION_DAYS
    }

    async function calculateCosts(logGroups: any[]) {
      const totalBytes = logGroups.reduce((sum, group) => sum + (group[2] || 0), 0)
      const totalGB = totalBytes / 1073741824
      const monthlyCost = totalGB * 0.03

      console.info(`\n📊 CloudWatch Log Storage Analysis:`)
      console.info(`Total storage: ${totalGB.toFixed(2)} GB`)
      console.info(`Estimated monthly storage cost: $${monthlyCost.toFixed(2)}`)

      // show top storage users
      const topGroups = logGroups
        .filter((g) => g[2] > 10000000) // > 10MB
        .sort((a, b) => b[2] - a[2])
        .slice(0, 5)

      if (topGroups.length > 0) {
        console.info(`\nTop ${topGroups.length} log groups by storage:`)
        topGroups.forEach((group) => {
          const gb = (group[2] / 1073741824).toFixed(2)
          console.info(`  ${group[0]}: ${gb} GB`)
        })
      }
    }

    try {
      console.info('🚀 AWS CloudWatch Configuration Script')
      console.info(`Profile: ${AWS_PROFILE}, Region: ${AWS_REGION}`)
      if (dryRun) {
        console.info('🔍 DRY RUN MODE - No changes will be made')
      }
      if (clearLogs) {
        console.info('⚠️  CLEAR LOGS MODE - Will delete and recreate log groups')
      }

      console.info('\nFetching log groups...')
      const logGroups = await getLogGroups()
      console.info(`Found ${logGroups.length} log groups`)

      // calculate current costs
      await calculateCosts(logGroups)

      if (clearLogs) {
        console.info('\n🗑️  Clearing and recreating log groups...')
        if (!dryRun) {
          console.info('Waiting 5 seconds before deletion...')
          await Bun.sleep(5000)
        }

        let processed = 0
        for (const group of logGroups) {
          const [logGroupName] = group
          const retentionDays = getRetentionDays(logGroupName)

          if (dryRun) {
            console.info(
              `[DRY RUN] Would delete and recreate: ${logGroupName} with ${retentionDays} day retention`
            )
          } else {
            console.info(`Processing: ${logGroupName}`)
          }

          // delete and recreate
          await deleteLogGroup(logGroupName)
          await createLogGroup(logGroupName)
          await setRetentionPolicy(logGroupName, retentionDays)

          processed++
          if (processed % 10 === 0) {
            console.info(`Progress: ${processed}/${logGroups.length}`)
          }
        }
        console.info(`✅ Processed ${processed} log groups`)
      } else {
        console.info('\n🔧 Setting retention policies...')
        let updated = 0
        for (const group of logGroups) {
          const [logGroupName, currentRetention] = group
          const targetRetention = getRetentionDays(logGroupName)

          // skip if already has appropriate retention
          if (currentRetention && currentRetention <= targetRetention) {
            continue
          }

          if (dryRun) {
            console.info(
              `[DRY RUN] Would update retention for ${logGroupName}: ${currentRetention || 'Never expire'} → ${targetRetention} days`
            )
          } else {
            console.info(
              `Updating retention for ${logGroupName}: ${currentRetention || 'Never expire'} → ${targetRetention} days`
            )
          }

          await setRetentionPolicy(logGroupName, targetRetention)
          updated++
        }
        console.info(`✅ Updated retention for ${updated} log groups`)
      }

      // set up billing alarms
      if (!dryRun) {
        console.info('\n⏰ Setting up billing alarms...')
        await setupBillingAlarms()
        await setupLogIngestionAlarm()
        console.info('✅ Billing alarms configured')
      } else {
        console.info('\n[DRY RUN] Would set up billing alarms')
      }

      console.info('\n✨ Configuration complete!')
    } catch (error) {
      console.error('❌ Error:', error)
      process.exit(1)
    }
  })
