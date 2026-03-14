<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Seed a broader subject catalog used across demo data.
     */
    public function run(): void
    {
        $subjects = [
            [
                'name' => 'Accounting',
                'description' => 'Financial reporting, budgeting, and introductory auditing concepts.',
                'is_active' => true,
            ],
            [
                'name' => 'Business Management',
                'description' => 'Foundations of management, operations, and organisational behaviour.',
                'is_active' => true,
            ],
            [
                'name' => 'Computer Science',
                'description' => 'Programming, software engineering, and applied computing fundamentals.',
                'is_active' => true,
            ],
            [
                'name' => 'Cyber Security',
                'description' => 'Network defence, secure systems design, and threat awareness.',
                'is_active' => true,
            ],
            [
                'name' => 'Data Science',
                'description' => 'Data analysis, visualisation, and statistical modelling for decision-making.',
                'is_active' => true,
            ],
            [
                'name' => 'Economics',
                'description' => 'Microeconomics, macroeconomics, and market analysis fundamentals.',
                'is_active' => true,
            ],
            [
                'name' => 'Engineering Mathematics',
                'description' => 'Applied calculus, matrices, and modelling techniques for engineering study.',
                'is_active' => true,
            ],
            [
                'name' => 'English Literature',
                'description' => 'Critical reading, textual analysis, and interpretation of literary works.',
                'is_active' => true,
            ],
            [
                'name' => 'Graphic Design',
                'description' => 'Visual communication, layout principles, and digital design workflows.',
                'is_active' => true,
            ],
            [
                'name' => 'Human Resource Management',
                'description' => 'Recruitment, performance management, and workplace policy fundamentals.',
                'is_active' => true,
            ],
            [
                'name' => 'International Business',
                'description' => 'Global trade, cross-cultural management, and international strategy.',
                'is_active' => true,
            ],
            [
                'name' => 'Law',
                'description' => 'Legal systems, contract principles, and case-based reasoning practice.',
                'is_active' => true,
            ],
            [
                'name' => 'Mathematics',
                'description' => 'Core algebra, calculus, and quantitative problem-solving practice.',
                'is_active' => true,
            ],
            [
                'name' => 'Mechanical Engineering',
                'description' => 'Statics, dynamics, materials, and core mechanical design concepts.',
                'is_active' => true,
            ],
            [
                'name' => 'Media Studies',
                'description' => 'Digital media analysis, communication theory, and content evaluation.',
                'is_active' => true,
            ],
            [
                'name' => 'Physics',
                'description' => 'Classical mechanics, electricity, and scientific problem-solving practice.',
                'is_active' => true,
            ],
            [
                'name' => 'Project Management',
                'description' => 'Planning, scheduling, risk control, and delivery management techniques.',
                'is_active' => true,
            ],
            [
                'name' => 'Psychology',
                'description' => 'Behavioural science, cognition, and research methods in psychology.',
                'is_active' => true,
            ],
            [
                'name' => 'Software Engineering',
                'description' => 'Requirements, system design, testing, and collaborative development practices.',
                'is_active' => true,
            ],
            [
                'name' => 'Statistics',
                'description' => 'Probability, inference, and data-driven reasoning for academic study.',
                'is_active' => true,
            ],
            [
                'name' => 'Academic English',
                'description' => 'Writing, reading, and presentation skills for university study.',
                'is_active' => false,
            ],
            [
                'name' => 'Foundation Chemistry',
                'description' => 'Introductory chemical principles, reactions, and laboratory theory.',
                'is_active' => false,
            ],
            [
                'name' => 'Mobile App Development',
                'description' => 'User-focused application design and development for modern mobile platforms.',
                'is_active' => false,
            ],
        ];

        foreach ($subjects as $subjectData) {
            Subject::create($subjectData);
        }
    }
}
