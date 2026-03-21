import './globals.css'

export const metadata = {
  title: 'Daytona Postventa',
  description: 'Dashboard de KPIs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}