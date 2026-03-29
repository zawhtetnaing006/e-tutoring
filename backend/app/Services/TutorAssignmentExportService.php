<?php

namespace App\Services;

use App\Models\TutorAssignment;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class TutorAssignmentExportService
{
    /**
     * @param  Collection<int, TutorAssignment>  $tutorAssignments
     */
    public function createSpreadsheet(Collection $tutorAssignments): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = ['Tutor', 'Student', 'From Date', 'To Date', 'Status'];
        $sheet->fromArray($headers, null, 'A1');

        $rowNumber = 2;

        foreach ($tutorAssignments as $tutorAssignment) {
            $sheet->fromArray([
                $tutorAssignment->tutor?->name ?? sprintf('Tutor #%d', (int) $tutorAssignment->tutor_user_id),
                $tutorAssignment->student?->name ?? sprintf('Student #%d', (int) $tutorAssignment->student_user_id),
                $tutorAssignment->start_date,
                $tutorAssignment->end_date,
                $tutorAssignment->status !== null && $tutorAssignment->status !== ''
                    ? ucfirst(strtolower($tutorAssignment->status))
                    : '—',
            ], null, "A{$rowNumber}");

            $rowNumber++;
        }

        foreach (range('A', 'E') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        return $spreadsheet;
    }

    public function createWriter(Spreadsheet $spreadsheet): Xlsx
    {
        return new Xlsx($spreadsheet);
    }
}
