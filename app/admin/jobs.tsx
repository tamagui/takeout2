import { useState } from 'react'
import type { TableSortDirection } from 'start/ui'
import { Table } from 'start/ui'
import { ScrollView, SizableText, XStack, YStack } from 'tamagui'
import type { Job } from '~/data/models'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { LabeledGroup } from '~/interface/forms/LabeledGroup'
import { Menu } from '~/interface/menu/Menu'
import { useQuery, zero } from '~/zero/client'

export function AdminJobsPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [sortColumn, setSortColumn] = useState<keyof Job>('createdAt')
  const [sortDirection, setSortDirection] = useState<TableSortDirection>('desc')
  const [pageCursors, setPageCursors] = useState<(Job | undefined)[]>([undefined])
  const currentPage = pageCursors.length - 1

  const lastCursor = pageCursors[currentPage]

  let query = zero.query.job.orderBy(sortColumn, sortDirection)

  if (lastCursor) {
    query = query.start(lastCursor)
  }

  query = query.limit(50)

  const [jobs, status] = useQuery(query)

  console.info('jobs', jobs, status)

  const handleSort = (column: string, direction: TableSortDirection) => {
    setSortColumn(column as keyof Job)
    setSortDirection(direction)
    setPageCursors([undefined])
  }

  const handleNextPage = () => {
    if (jobs && jobs.length === 50) {
      setPageCursors((prev) => [...prev, jobs[jobs.length - 1]])
    }
  }

  const handlePrevPage = () => {
    if (pageCursors.length > 1) {
      setPageCursors((prev) => prev.slice(0, -1))
    }
  }

  const handleInsertTestJob = async () => {
    await zero.mutate.job.insert({
      id: `test-${Date.now()}`,
      name: 'test-job',
      version: 1,
      status: 'pending',
      priority: 'normal',
      payload: {
        message: 'test from admin ui',
        duration: 3000,
      },
      maxRetries: 3,
      retryCount: 0,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).client
  }

  const handleInsertTestFailJob = async () => {
    await zero.mutate.job.insert({
      id: `test-fail-${Date.now()}`,
      name: 'test-fail-job',
      version: 1,
      status: 'pending',
      priority: 'high',
      payload: {
        errorMessage: 'test failure from admin ui',
        failAtProgress: 50,
      },
      maxRetries: 2,
      retryCount: 0,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).client
  }

  return (
    <YStack flex={1} width="100%" height="100vh">
      <XStack
        items="center"
        justify="space-between"
        p="$4"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <SizableText size="$8" fontWeight="bold">
          jobs admin
        </SizableText>
        <Menu
          items={[
            {
              id: 'insert-test-job',
              children: 'insert test job',
              onPress: handleInsertTestJob,
            },
            {
              id: 'insert-test-fail-job',
              children: 'insert test fail job',
              onPress: handleInsertTestFailJob,
            },
          ]}
        >
          <Menu.Trigger>
            <ButtonSimple>actions</ButtonSimple>
          </Menu.Trigger>
        </Menu>
      </XStack>

      <XStack flex={1} overflow="hidden">
        <YStack flex={1} borderRightWidth={1} borderRightColor="$borderColor">
          <YStack flex={1}>
            <Table
              data={jobs}
              columns={['id', 'name', 'status', 'priority', 'progress', 'createdAt']}
              columnWidths={{
                id: 200,
                name: 150,
                status: 100,
                priority: 100,
                progress: 100,
                createdAt: 180,
              }}
              columnTypes={{
                createdAt: 'date-number',
              }}
              size="small"
              sortable
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              onPressCell={({ row }) => setSelectedJob(row as Job)}
              height="calc(100vh - 180px)"
            />
          </YStack>

          <XStack
            items="center"
            justify="space-between"
            p="$3"
            borderTopWidth={1}
            borderTopColor="$borderColor"
          >
            <XStack gap="$2" items="center">
              <ButtonSimple
                size="small"
                disabled={currentPage === 0}
                onPress={handlePrevPage}
              >
                previous
              </ButtonSimple>
              <SizableText>page {currentPage + 1}</SizableText>
              <ButtonSimple
                size="small"
                disabled={(jobs?.length || 0) < 50}
                onPress={handleNextPage}
              >
                next
              </ButtonSimple>
            </XStack>
          </XStack>
        </YStack>

        <YStack flex={1} p="$4" overflow="hidden">
          {selectedJob ? (
            <ScrollView>
              <YStack gap="$4">
                <LabeledGroup label="basic info">
                  <YStack gap="$2">
                    <XStack gap="$2">
                      <SizableText fontWeight="bold" width={120}>
                        id:
                      </SizableText>
                      <SizableText>{selectedJob.id}</SizableText>
                    </XStack>
                    <XStack gap="$2">
                      <SizableText fontWeight="bold" width={120}>
                        name:
                      </SizableText>
                      <SizableText>{selectedJob.name}</SizableText>
                    </XStack>
                    <XStack gap="$2">
                      <SizableText fontWeight="bold" width={120}>
                        version:
                      </SizableText>
                      <SizableText>{selectedJob.version}</SizableText>
                    </XStack>
                    <XStack gap="$2">
                      <SizableText fontWeight="bold" width={120}>
                        status:
                      </SizableText>
                      <SizableText>{selectedJob.status}</SizableText>
                    </XStack>
                    <XStack gap="$2">
                      <SizableText fontWeight="bold" width={120}>
                        priority:
                      </SizableText>
                      <SizableText>{selectedJob.priority}</SizableText>
                    </XStack>
                    <XStack gap="$2">
                      <SizableText fontWeight="bold" width={120}>
                        progress:
                      </SizableText>
                      <SizableText>{selectedJob.progress}%</SizableText>
                    </XStack>
                  </YStack>
                </LabeledGroup>

                <LabeledGroup label="timing">
                  <YStack gap="$2">
                    <XStack gap="$2">
                      <SizableText fontWeight="bold" width={120}>
                        created:
                      </SizableText>
                      <SizableText>
                        {new Date(selectedJob.createdAt).toLocaleString()}
                      </SizableText>
                    </XStack>
                    {selectedJob.scheduledFor && (
                      <XStack gap="$2">
                        <SizableText fontWeight="bold" width={120}>
                          scheduled for:
                        </SizableText>
                        <SizableText>
                          {new Date(selectedJob.scheduledFor).toLocaleString()}
                        </SizableText>
                      </XStack>
                    )}
                    {selectedJob.startedAt && (
                      <XStack gap="$2">
                        <SizableText fontWeight="bold" width={120}>
                          started:
                        </SizableText>
                        <SizableText>
                          {new Date(selectedJob.startedAt).toLocaleString()}
                        </SizableText>
                      </XStack>
                    )}
                    {selectedJob.completedAt && (
                      <XStack gap="$2">
                        <SizableText fontWeight="bold" width={120}>
                          completed:
                        </SizableText>
                        <SizableText>
                          {new Date(selectedJob.completedAt).toLocaleString()}
                        </SizableText>
                      </XStack>
                    )}
                    {selectedJob.completedAt && selectedJob.startedAt && (
                      <XStack gap="$2">
                        <SizableText fontWeight="bold" width={120}>
                          duration:
                        </SizableText>
                        <SizableText>
                          {Math.round(
                            (new Date(selectedJob.completedAt).getTime() -
                              new Date(selectedJob.startedAt).getTime()) /
                              1000
                          )}
                          s
                        </SizableText>
                      </XStack>
                    )}
                  </YStack>
                </LabeledGroup>

                <LabeledGroup label="retry info">
                  <YStack gap="$2">
                    <XStack gap="$2">
                      <SizableText fontWeight="bold" width={120}>
                        retry count:
                      </SizableText>
                      <SizableText>
                        {selectedJob.retryCount} / {selectedJob.maxRetries}
                      </SizableText>
                    </XStack>
                  </YStack>
                </LabeledGroup>

                {selectedJob.payload && (
                  <LabeledGroup label="payload">
                    <YStack
                      bg="$background"
                      p="$2"
                      rounded="$2"
                      borderWidth={1}
                      borderColor="$borderColor"
                    >
                      <SizableText fontFamily="$mono" size="$2">
                        {JSON.stringify(selectedJob.payload, null, 2)}
                      </SizableText>
                    </YStack>
                  </LabeledGroup>
                )}

                {selectedJob.result && (
                  <LabeledGroup label="result">
                    <YStack
                      bg="$background"
                      p="$2"
                      rounded="$2"
                      borderWidth={1}
                      borderColor="$borderColor"
                    >
                      <SizableText fontFamily="$mono" size="$2">
                        {JSON.stringify(selectedJob.result, null, 2)}
                      </SizableText>
                    </YStack>
                  </LabeledGroup>
                )}

                {selectedJob.logs && (
                  <LabeledGroup label="logs">
                    <YStack
                      bg="$background"
                      p="$2"
                      rounded="$2"
                      borderWidth={1}
                      borderColor="$borderColor"
                      maxH={400}
                    >
                      <ScrollView>
                        <SizableText fontFamily="$mono" size="$1">
                          {selectedJob.logs}
                        </SizableText>
                      </ScrollView>
                    </YStack>
                  </LabeledGroup>
                )}

                {selectedJob.error && (
                  <LabeledGroup label="error">
                    <YStack
                      bg="$red2"
                      p="$2"
                      rounded="$2"
                      borderWidth={1}
                      borderColor="$red7"
                    >
                      <SizableText fontFamily="$mono" size="$2" color="$red11">
                        {selectedJob.error}
                      </SizableText>
                    </YStack>
                  </LabeledGroup>
                )}
              </YStack>
            </ScrollView>
          ) : (
            <YStack flex={1} items="center" justify="center">
              <SizableText color="$color9">select a job to view details</SizableText>
            </YStack>
          )}
        </YStack>
      </XStack>
    </YStack>
  )
}
