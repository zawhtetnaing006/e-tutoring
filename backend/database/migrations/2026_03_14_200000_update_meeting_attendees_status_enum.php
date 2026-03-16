<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL, we need to alter the enum column
        DB::statement("ALTER TABLE meeting_attendees MODIFY COLUMN status ENUM('PRESENCE', 'ABSENCE', 'ON_LEAVE') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE meeting_attendees MODIFY COLUMN status ENUM('PRESENCE', 'ON_LEAVE') NOT NULL");
    }
};
