<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $connection = Schema::connection(config('activitylog.database_connection'));
        $tableName = config('activitylog.table_name');

        if (! $connection->hasTable($tableName)) {
            return;
        }

        $renameSubjectType = $connection->hasColumn($tableName, 'subject_type');
        $renameSubjectId = $connection->hasColumn($tableName, 'subject_id');
        $renameCauserType = $connection->hasColumn($tableName, 'causer_type');
        $renameCauserId = $connection->hasColumn($tableName, 'causer_id');

        if (! $renameSubjectType && ! $renameSubjectId && ! $renameCauserType && ! $renameCauserId) {
            return;
        }

        $connection->table($tableName, function (Blueprint $table) use (
            $renameSubjectType,
            $renameSubjectId,
            $renameCauserType,
            $renameCauserId
        ): void {
            if ($renameSubjectType) {
                $table->renameColumn('subject_type', 'target_type');
            }

            if ($renameSubjectId) {
                $table->renameColumn('subject_id', 'target_id');
            }

            if ($renameCauserType) {
                $table->renameColumn('causer_type', 'actor_type');
            }

            if ($renameCauserId) {
                $table->renameColumn('causer_id', 'actor_id');
            }
        });
    }

    public function down(): void
    {
        $connection = Schema::connection(config('activitylog.database_connection'));
        $tableName = config('activitylog.table_name');

        if (! $connection->hasTable($tableName)) {
            return;
        }

        $renameTargetType = $connection->hasColumn($tableName, 'target_type');
        $renameTargetId = $connection->hasColumn($tableName, 'target_id');
        $renameActorType = $connection->hasColumn($tableName, 'actor_type');
        $renameActorId = $connection->hasColumn($tableName, 'actor_id');

        if (! $renameTargetType && ! $renameTargetId && ! $renameActorType && ! $renameActorId) {
            return;
        }

        $connection->table($tableName, function (Blueprint $table) use (
            $renameTargetType,
            $renameTargetId,
            $renameActorType,
            $renameActorId
        ): void {
            if ($renameTargetType) {
                $table->renameColumn('target_type', 'subject_type');
            }

            if ($renameTargetId) {
                $table->renameColumn('target_id', 'subject_id');
            }

            if ($renameActorType) {
                $table->renameColumn('actor_type', 'causer_type');
            }

            if ($renameActorId) {
                $table->renameColumn('actor_id', 'causer_id');
            }
        });
    }
};
