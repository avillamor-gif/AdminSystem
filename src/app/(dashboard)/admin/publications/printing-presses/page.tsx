import { redirect } from 'next/navigation'

export default function PrintingPressesPage() {
  redirect('/admin/publications/setup?tab=printing-presses')
}
