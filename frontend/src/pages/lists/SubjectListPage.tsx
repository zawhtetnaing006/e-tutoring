import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui'
import {
  SubjectListHeader,
  ViewSubjectModal,
  AddSubjectModal,
  EditSubjectModal,
  SubjectFilters,
  SubjectTable,
  SubjectStaffActionsPortal,
} from '@/components/subjects'
import { useSubjectListPage } from './useSubjectListPage'

export type SubjectListPageProps = {
  title: string
  subtitle: string
  addLabel: string
  viewModalTitle: string
  addModalTitle: string
  addModalSubtitle: string
  editModalTitle: string
  editModalSubtitle: string
  showStaffActions?: boolean
  dropdownActiveLabel?: string
  dropdownInactiveLabel?: string
}

export function SubjectListPage({
  title,
  subtitle,
  addLabel,
  viewModalTitle,
  addModalTitle,
  addModalSubtitle,
  editModalTitle,
  editModalSubtitle,
  showStaffActions = false,
  dropdownActiveLabel,
  dropdownInactiveLabel,
}: SubjectListPageProps) {
  const {
    setPage,
    setPerPage,
    setSearch,
    setViewSubject,
    setEditSubject,
    setAddOpen,
    staffRow,
    dropdownRect,
    invalidateList,
    isLoading,
    isError,
    toggleStatusMutation,
    deleteMutation,
    deleteTarget,
    requestDelete,
    confirmDelete,
    cancelDelete,
    totalItems,
    totalPages,
    start,
    end,
    filteredRows,
    allSelected,
    selectAllRef,
    toggleSelectAll,
    toggleSelect,
    handleToggleRowMenu,
    closeStaffMenu,
    search,
    selectedIds,
    viewSubject,
    editSubject,
    addOpen,
    openRowId,
    page,
    perPage,
    sortKey,
    sortDir,
    handleSort,
    statusFilter,
    setStatusFilter,
  } = useSubjectListPage(showStaffActions)

  return (
    <div className="w-full">
      <SubjectListHeader
        title={title}
        subtitle={subtitle}
        addLabel={addLabel}
        onAdd={() => setAddOpen(true)}
      />
      <SubjectFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={value => {
          setStatusFilter(value)
          setPage(1)
        }}
      />
      <SubjectTable
        filteredRows={filteredRows}
        isLoading={isLoading}
        isError={isError}
        selectedIds={selectedIds}
        allSelected={allSelected}
        selectAllRef={selectAllRef}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelect={toggleSelect}
        onView={setViewSubject}
        onEdit={setEditSubject}
        onDelete={requestDelete}
        onToggleRowMenu={handleToggleRowMenu}
        openRowId={openRowId}
        showStaffActions={showStaffActions}
        deletePending={deleteMutation.isPending}
        page={page}
        perPage={perPage}
        totalItems={totalItems}
        totalPages={totalPages}
        start={start}
        end={end}
        onPageChange={setPage}
        onPerPageChange={next => {
          setPerPage(next)
          setPage(1)
        }}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
      />
      {showStaffActions && (
        <SubjectStaffActionsPortal
          row={staffRow}
          dropdownRect={dropdownRect}
          onClose={closeStaffMenu}
          onSetActive={(id, isActive) => {
            toggleStatusMutation.mutate(
              { id, isActive },
              { onSuccess: closeStaffMenu }
            )
          }}
          isPending={toggleStatusMutation.isPending}
          activeLabel={dropdownActiveLabel}
          inactiveLabel={dropdownInactiveLabel}
        />
      )}
      {viewSubject && (
        <ViewSubjectModal
          subject={viewSubject}
          loading={false}
          onClose={() => setViewSubject(null)}
          title={viewModalTitle}
        />
      )}
      {addOpen && (
        <AddSubjectModal
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            invalidateList()
            toast.success('Subject created successfully')
          }}
          title={addModalTitle}
          subtitle={addModalSubtitle}
        />
      )}
      {editSubject && (
        <EditSubjectModal
          subject={editSubject}
          onClose={() => setEditSubject(null)}
          onSuccess={() => {
            invalidateList()
            toast.success('Subject updated successfully')
          }}
          title={editModalTitle}
          subtitle={editModalSubtitle}
        />
      )}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete subject?"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
