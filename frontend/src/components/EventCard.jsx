import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../utils/cn';

export const EventCard = ({ event, onGetTickets }) => {
  const formatDate = (date) => {
    if (!date) return 'TBD';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const formatTime = (date) => {
    if (!date) return '';
    return format(new Date(date), 'h:mm a');
  };

  const getCategoryColor = (category) => {
    const colors = {
      music: 'bg-purple-100 text-purple-800',
      arts: 'bg-pink-100 text-pink-800',
      food: 'bg-orange-100 text-orange-800',
      sports: 'bg-blue-100 text-blue-800',
      comedy: 'bg-yellow-100 text-yellow-800',
      family: 'bg-green-100 text-green-800',
      business: 'bg-gray-100 text-gray-800',
      community: 'bg-teal-100 text-teal-800',
    };
    return category?.toLowerCase ? colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: 'bg-green-100 text-green-800',
      updated: 'bg-blue-100 text-blue-800',
      imported: 'bg-purple-100 text-purple-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {event.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {event.category && event.category.length > 0 && (
            <span className={cn(
              'absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium',
              getCategoryColor(event.category[0])
            )}>
              {event.category[0]}
            </span>
          )}
        </div>
      )}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {event.title}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <Calendar size={16} className="mr-2 flex-shrink-0" />
            <span>{formatDate(event.dateTime)}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Clock size={16} className="mr-2 flex-shrink-0" />
            <span>{formatTime(event.dateTime)}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin size={16} className="mr-2 flex-shrink-0" />
            <span className="line-clamp-1">{event.venue?.name || 'Location TBD'}</span>
          </div>
        </div>

        {event.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {event.status && (
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                getStatusBadge(event.status)
              )}>
                {event.status}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {event.source?.name}
            </span>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => onGetTickets(event)}
            className="flex items-center gap-1"
          >
            Get Tickets
            <ExternalLink size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};
