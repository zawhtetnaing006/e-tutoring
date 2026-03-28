export function AppCopyright() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background px-4 py-4 text-right text-sm text-text-disabled sm:px-6">
      <p>Copyright © {currentYear} E-Tutor System. All rights reserved.</p>
    </footer>
  )
}
