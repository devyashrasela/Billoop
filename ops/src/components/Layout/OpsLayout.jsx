import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import '../../AppLayout.css';

export const OpsLayout = () => {
  return (
    <div className="sheet">
      <div className="app">
        <Sidebar />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header />
          <main className="main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default OpsLayout;
