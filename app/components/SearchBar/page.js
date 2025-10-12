"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchResults from '../SearchResults/page';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const doSearch = async (q) => {
    if (!q) {
      setResults({ users: [], posts: [] });
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data || { users: [], posts: [] });
        setOpen(true);
      }
    } catch (err) {
      console.error('Search error', err);
    }
  };

  const onChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => doSearch(v.trim()), 300);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      const v = query.trim();
      // navigate to search page
      router.push(`/search?q=${encodeURIComponent(v)}`);
    }
  };

  const onSearchClick = () => {
    const v = query.trim();
    router.push(`/search?q=${encodeURIComponent(v)}`);
  };

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="ค้นหาใน Kon Sakon"
        className="bg-gray-100 border-0 rounded-full py-2 pl-10 pr-10 w-64 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
        onFocus={() => { if ((results.users?.length || results.posts?.length)) setOpen(true); }}
      />

      {/* Search button (right) */}
      {/* <button
        onClick={onSearchClick}
        className="absolute inset-y-0 right-2 flex items-center pr-2 text-gray-500 hover:text-gray-700"
        aria-label="Search"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button> */}

      {open && (
        <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <SearchResults results={results} query={query} />
        </div>
      )}
    </div>
  );
}
