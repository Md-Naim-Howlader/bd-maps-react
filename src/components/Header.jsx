import React from 'react';

export default function Header({ currentTab, setTab }) {
  const tabs = [
    { id: 'map', label: 'আমার ম্যাপ' },
    { id: 'world', label: 'বিশ্ব ম্যাপ' },
    { id: 'explore', label: 'কোথায় ঘুরবেন' },
    { id: 'plan', label: 'ট্রিপ প্ল্যানার' }
  ];

  return (
    <nav>
      <div className="logo" onClick={() => setTab('map')}>
        <span className="logo-mark"></span>
        <span>আমার দেশ ম্যাপ</span>
      </div>
      <div className="tabs" role="navigation" aria-label="পাতা">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => setTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
