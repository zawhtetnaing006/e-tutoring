<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class UserExportService
{
    /**
     * @param  Collection<int, User>  $users
     */
    public function createSpreadsheet(Collection $users): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = ['Name', 'Role', 'Email', 'Phone', 'Address', 'Status'];
        $sheet->fromArray($headers, null, 'A1');

        $rowNumber = 2;

        foreach ($users as $user) {
            $sheet->fromArray([
                $user->name,
                $user->role?->name ?? $user->role?->code ?? '—',
                $user->email,
                $user->phone ?: '—',
                $this->formatAddress($user),
                $user->is_active ? 'Active' : 'Inactive',
            ], null, "A{$rowNumber}");

            $rowNumber++;
        }

        foreach (range('A', 'F') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        return $spreadsheet;
    }

    public function createWriter(Spreadsheet $spreadsheet): Xlsx
    {
        return new Xlsx($spreadsheet);
    }

    private function formatAddress(User $user): string
    {
        $parts = array_values(array_filter([
            $user->country,
            $user->city,
            $user->township,
        ], static fn (?string $part): bool => $part !== null && $part !== ''));

        if ($user->address !== null && $user->address !== '') {
            array_unshift($parts, $user->address);
        }

        return $parts === [] ? '—' : implode(', ', $parts);
    }
}
