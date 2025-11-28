"use client"

export const Navigation = ({ activeModule, onModuleChange, isManager }) => {
  const navItems = [
    { id: "projects", label: "Gestión de Proyectos", role: "leader" },
    { id: "approval", label: "Aprobación", role: "manager" },
    { id: "tracking", label: "Seguimiento", role: "both" },
    { id: "history", label: "Histórico", role: "both" },
    { id: "users", label: "Registro de Usuarios", role: "manager" },
  ]

  const filteredItems = navItems.filter((item) => {
    if (item.role === "both") return true
    if (item.role === "manager") return isManager
    if (item.role === "leader") return !isManager
    return true
  })

  return (
    <nav className="bg-blue-800 shadow-md">
      <div className="max-w-7xl mx-auto">
        <ul className="flex">
          {filteredItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onModuleChange(item.id)}
                className={`block px-6 py-4 font-medium transition-all border-b-3 ${
                  activeModule === item.id
                    ? "bg-white/15 text-white border-purple-800"
                    : "text-white/90 hover:bg-white/10 hover:text-white border-transparent"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
