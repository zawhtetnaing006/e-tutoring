import { SubjectListPage } from '@/pages/lists/SubjectListPage'

export function SubjectsListPage() {
  return (
    <SubjectListPage
      title="Subject"
      subtitle="Manage subjects and course offerings"
      addLabel="Add Subject"
      viewModalTitle="Detail Subject"
      addModalTitle="Create New Subject"
      addModalSubtitle="Fill in the details below to add a new subject..."
      editModalTitle="Edit Subject"
      editModalSubtitle="Fill in the details below to edit a subject..."
      showStaffActions
      dropdownActiveLabel="Active Subject"
      dropdownInactiveLabel="Inactive Subject"
    />
  )
}
