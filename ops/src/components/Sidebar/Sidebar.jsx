import React, { useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAdmin } from '../../features/auth/authSlice';
import {
  selectExpandedGroups,
  selectSidebarOpen,
  toggleGroup,
  setExpandedOnlyGroup,
  closeSidebar,
} from '../../features/ui/uiSlice';
import {
  SIDEBAR_MENU_CONFIG,
  ChevronDownIcon,
} from './sidebar.config';
import './Sidebar.css';

export const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAdmin = useSelector(selectIsAdmin);
  const expandedGroups = useSelector(selectExpandedGroups);
  const sidebarOpen = useSelector(selectSidebarOpen);

  const visibleItems = useMemo(
    () => SIDEBAR_MENU_CONFIG.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  // Find the parent group matching the current pathname
  const activeParentKey = useMemo(() => {
    const found = visibleItems.find(
      (item) =>
        item.children &&
        item.children.some(
          (child) =>
            location.pathname === child.to ||
            location.pathname.startsWith(`${child.to}/`)
        )
    );
    return found ? found.key : null;
  }, [visibleItems, location.pathname]);

  // Open the active parent group on navigation / initial load (default others closed)
  useEffect(() => {
    if (activeParentKey) {
      dispatch(setExpandedOnlyGroup(activeParentKey));
    }
  }, [activeParentKey, dispatch]);

  const handleLinkClick = () => {
    if (sidebarOpen) {
      dispatch(closeSidebar());
    }
  };

  const handleToggleParent = (key) => {
    dispatch(toggleGroup(key));
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar__overlay"
          onClick={() => dispatch(closeSidebar())}
          aria-hidden="true"
        />
      )}
      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar__brand">
          <i className="sidebar__brand-icon" aria-hidden="true">
            <b></b>
            <b></b>
            <b></b>
            <b></b>
          </i>
          <span className="sidebar__brand-text">Brightloop</span>
        </div>

        <nav className="sidebar__nav">
          <ul className="sidebar__list" role="list">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = Boolean(item.children && item.children.length > 0);

              if (!hasChildren) {
                return (
                  <li key={item.key} className="sidebar__group-item">
                    <NavLink
                      to={item.to}
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
                      }
                      aria-current={location.pathname === item.to ? 'page' : undefined}
                    >
                      {Icon && <Icon />}
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge !== null && (
                        <span className="sidebar__badge">{item.badge}</span>
                      )}
                    </NavLink>
                  </li>
                );
              }

              const isExpanded = Boolean(expandedGroups[item.key]);
              const isParentActive = activeParentKey === item.key;
              const controlsId = `group-content-${item.key}`;

              return (
                <li key={item.key} className="sidebar__group-item">
                  <button
                    type="button"
                    className={`sidebar__parent ${
                      isParentActive ? 'sidebar__parent--active' : ''
                    }`}
                    onClick={() => handleToggleParent(item.key)}
                    aria-expanded={isExpanded}
                    aria-controls={controlsId}
                  >
                    <span className="sidebar__parent-lead">
                      {Icon && <Icon />}
                      <span className="sidebar__parent-label">{item.label}</span>
                    </span>
                    <span className="sidebar__parent-trail">
                      {item.badge !== undefined && item.badge !== null && (
                        <span className="sidebar__badge">{item.badge}</span>
                      )}
                      <span
                        className={`sidebar__chevron ${
                          isExpanded ? 'sidebar__chevron--expanded' : ''
                        }`}
                        aria-hidden="true"
                      >
                        <ChevronDownIcon />
                      </span>
                    </span>
                  </button>

                  <div
                    id={controlsId}
                    className={`sidebar__children-wrapper ${
                      isExpanded ? 'sidebar__children-wrapper--expanded' : ''
                    }`}
                  >
                    <div className="sidebar__children-inner">
                      <ul className="sidebar__children" role="list">
                        {item.children.map((child, index) => {
                          const isLast = index === item.children.length - 1;
                          const isChildActive =
                            location.pathname === child.to ||
                            location.pathname.startsWith(`${child.to}/`);

                          return (
                            <li
                              key={child.to}
                              className={`sidebar__child-item ${
                                isLast ? 'sidebar__child-item--last' : ''
                              }`}
                            >
                              <NavLink
                                to={child.to}
                                onClick={handleLinkClick}
                                className={({ isActive }) =>
                                  `sidebar__child ${
                                    isActive || isChildActive
                                      ? 'sidebar__child--active'
                                      : ''
                                  }`
                                }
                                aria-current={
                                  location.pathname === child.to ? 'page' : undefined
                                }
                              >
                                {child.label}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
