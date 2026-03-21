import { CommunicationHubHeader } from './CommunicationHubHeader'
import { CommunicationHubWorkspace } from './CommunicationHubWorkspace'
import { useCommunicationHub } from './useCommunicationHub'

export function CommunicationHubPage() {
  const hub = useCommunicationHub()

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-0 w-full flex-col sm:h-[calc(100vh-6rem)] lg:h-[calc(100vh-3rem)]">
      <section className="flex min-h-0 flex-1 flex-col space-y-3 sm:space-y-4 lg:space-y-5">
        <CommunicationHubHeader />
        <CommunicationHubWorkspace hub={hub} />
      </section>
    </div>
  )
}
