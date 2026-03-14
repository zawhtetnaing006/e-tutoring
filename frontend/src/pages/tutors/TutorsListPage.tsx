import { UserListPage } from '@/pages/lists/UserListPage'

export function TutorsListPage() {
  return (
    <UserListPage
      title="Tutors"
      subtitle="Manage tutors and their subjects"
      userType="TUTOR"
      addLabel="Add Tutor"
      viewModalTitle="Detail Tutor"
      addModalTitle="Create New Tutor"
      addModalSubtitle="Fill in the details below to add a new tutor...."
      editModalTitle="Edit Tutor"
      editModalSubtitle="Fill in the details below to edit a tutor...."
      layoutVariant="tutor"
      showStaffActions
      dropdownActiveLabel="Activate Tutor"
      dropdownInactiveLabel="Deactivate Tutor"
    />
  )
}
