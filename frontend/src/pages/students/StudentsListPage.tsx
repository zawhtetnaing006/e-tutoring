import { UserListPage } from '@/pages/lists/UserListPage'

export function StudentsListPage() {
  return (
    <UserListPage
      title="Students"
      subtitle="Manage students and their enrollments"
      userType="STUDENT"
      addLabel="Add Student"
      viewModalTitle="Detail Student"
      addModalTitle="Create New Student"
      addModalSubtitle="Fill in the details below to add a new student...."
      editModalTitle="Edit Student"
      editModalSubtitle="Fill in the details below to edit a student...."
      layoutVariant="student"
      showStaffActions
      dropdownActiveLabel="Active Student"
      dropdownInactiveLabel="Inactive Student"
    />
  )
}
