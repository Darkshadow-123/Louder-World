import React, { useState, useEffect } from 'react';
import { Search, RotateCw, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { eventsAPI, adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

export const DashboardPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    city: 'Sydney',
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
    source: ''
  });
  const [importing, setImporting] = useState({});
  const [importNotes, setImportNotes] = '';

  useEffect(() => {
    console.log('Dashboard: authLoading:', authLoading, 'user:', !!user, 'isAdmin:', isAdmin);
    
    if (authLoading) return;
    
    if (!user || !isAdmin) {
      console.log('Dashboard: Redirecting to login - user:', user, 'isAdmin:', isAdmin);
      window.location.href = '/login';
      return;
    }
    
    console.log('Dashboard: Loading events');
    loadEvents();
  }, [page, filters, user, isAdmin, authLoading]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.filterEvents({
        ...filters,
        page,
        limit: 20
      });
      
      setEvents(response.data.events || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScrape = async () => {
    try {
      setScraping(true);
      await adminAPI.runScraper();
      await loadEvents();
    } catch (error) {
      console.error('Error running scraper:', error);
    } finally {
      setScraping(false);
    }
  };

  const handleImport = async (eventId) => {
    try {
      setImporting(prev => ({ ...prev, [eventId]: true }));
      await eventsAPI.importEvent(eventId, importNotes);
      await loadEvents();
    } catch (error) {
      console.error('Error importing event:', error);
    } finally {
      setImporting(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: 'bg-green-100 text-green-800',
      updated: 'bg-blue-100 text-blue-800',
      inactive: 'bg-gray-100 text-gray-800',
      imported: 'bg-purple-100 text-purple-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {localStorage.getItem('token') && <p className="text-gray-400 text-sm mt-2">Token: {localStorage.getItem('token').substring(0, 20)}...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and import Sydney events</p>
          </div>
          <Button
            onClick={handleRunScrape}
            disabled={scraping}
            className="flex items-center gap-2"
          >
            <RotateCw className={scraping ? 'animate-spin' : ''} size={16} />
            {scraping ? 'Scraping...' : 'Run Scrapers'}
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="updated">Updated</option>
                <option value="inactive">Inactive</option>
                <option value="imported">Imported</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <select
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">All Sources</option>
                <option value="Eventbrite">Eventbrite</option>
                <option value="Sydney Today">Sydney Today</option>
                <option value="Time Out Sydney">Time Out Sydney</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      Loading events...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No events found
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr
                      key={event._id}
                      onClick={() => setSelectedEvent(event)}
                      className={cn(
                        'hover:bg-gray-50 cursor-pointer transition-colors',
                        selectedEvent?._id === event._id && 'bg-blue-50'
                      )}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 max-w-xs truncate">
                          {event.title}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDate(event.dateTime)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {event.venue?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {event.source?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getStatusBadge(event.status)
                        )}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {event.status !== 'imported' && event.status !== 'inactive' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImport(event._id);
                            }}
                            disabled={importing[event._id]}
                            className="flex items-center gap-1"
                          >
                            {importing[event._id] ? 'Importing...' : 'Import'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {selectedEvent && (
            <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Event Details
              </h3>
              
              {selectedEvent.imageUrl && (
                <img
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Title</label>
                  <p className="text-sm text-gray-900">{selectedEvent.title}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">Date & Time</label>
                  <p className="text-sm text-gray-600">{formatDate(selectedEvent.dateTime)}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">Venue</label>
                  <p className="text-sm text-gray-600">
                    {selectedEvent.venue?.name}
                    {selectedEvent.venue?.address && (
                      <span className="text-xs text-gray-500 block">
                        {selectedEvent.venue.address}
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-600 line-clamp-4">
                    {selectedEvent.description || 'No description available'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">Source</label>
                  <p className="text-sm text-gray-600">{selectedEvent.source?.name}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">Original URL</label>
                  <a
                    href={selectedEvent.source?.eventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                  >
                    View on source
                    <ArrowRight size={14} />
                  </a>
                </div>

                {selectedEvent.category && selectedEvent.category.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Categories</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEvent.category.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.importedBy && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Imported By</label>
                    <p className="text-sm text-gray-600">
                      {selectedEvent.importedBy?.displayName || 'Unknown'}
                    </p>
                  </div>
                )}

                {selectedEvent.importedAt && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Imported At</label>
                    <p className="text-sm text-gray-600">
                      {formatDate(selectedEvent.importedAt)}
                    </p>
                  </div>
                )}

                {selectedEvent.status !== 'imported' && selectedEvent.status !== 'inactive' && (
                  <div className="pt-4 border-t">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Import Notes (optional)
                    </label>
                    <textarea
                      value={importNotes}
                      onChange={(e) => setImportNotes(e.target.value)}
                      placeholder="Add notes about this import..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="2"
                    />
                    <Button
                      className="w-full mt-2"
                      onClick={() => handleImport(selectedEvent._id)}
                      disabled={importing[selectedEvent._id]}
                    >
                      {importing[selectedEvent._id] ? 'Importing...' : 'Import Event'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
