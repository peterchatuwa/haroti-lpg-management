import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  filterNavSections,
  findSectionForPath,
  navSections,
  type NavSection,
} from '../config/nav-sections';

type SidebarNavProps = {
  isStaffAdmin: boolean;
};

function buildInitialExpanded(pathname: string, sections: NavSection[]) {
  const activeSection = findSectionForPath(pathname, sections);
  const expanded = new Set<string>(['overview', activeSection]);
  return expanded;
}

export function SidebarNav({ isStaffAdmin }: SidebarNavProps) {
  const { pathname } = useLocation();
  const sections = useMemo(
    () => filterNavSections(navSections, isStaffAdmin),
    [isStaffAdmin],
  );

  const [expanded, setExpanded] = useState(() =>
    buildInitialExpanded(pathname, sections),
  );

  useEffect(() => {
    const activeSection = findSectionForPath(pathname, sections);
    setExpanded((current) => {
      const next = new Set(current);
      next.add('overview');
      next.add(activeSection);
      return next;
    });
  }, [pathname, sections]);

  const toggleSection = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <nav className="nav-links">
      {sections.map((section) => {
        const isOpen = expanded.has(section.id);
        const isSingleDashboard =
          section.id === 'overview' && section.groups.length === 1;

        if (isSingleDashboard) {
          const item = section.groups[0].items[0];
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-top-link${isActive ? ' active' : ''}`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        }

        return (
          <div key={section.id} className="nav-section">
            <button
              type="button"
              className={`nav-section-toggle${isOpen ? ' open' : ''}`}
              onClick={() => toggleSection(section.id)}
              aria-expanded={isOpen}
            >
              <span>{section.label}</span>
              <ChevronDown size={16} className="nav-section-chevron" />
            </button>

            {isOpen && (
              <div className="nav-section-body">
                {section.groups.map((group) => (
                  <div key={group.label} className="nav-group">
                    {section.groups.length > 1 && (
                      <div className="nav-group-label">{group.label}</div>
                    )}
                    <div className="nav-group-items">
                      {group.items.map(({ to, label, icon: Icon }) => (
                        <NavLink
                          key={to}
                          to={to}
                          end={to === '/'}
                          className={({ isActive }) =>
                            isActive ? 'active' : undefined
                          }
                        >
                          <Icon size={18} />
                          {label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
