import React, { useState } from 'react';
import { ArrowLeft, Calendar, Plus, Edit3, Trash2, Gift, Bell } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { EmptyState } from '../../components/common';
import { useToast } from '../../components/ui/toast';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Event } from '../../types';

interface EventsProps {
  onBack: () => void;
}

interface EventForm {
  title: string;
  date: string;
  type: string;
  description: string;
  reminderDays: number;
}

export const Events = ({ onBack }: EventsProps): JSX.Element => {
  const { addToast } = useToast();
  const [events, setEvents] = useLocalStorage<Event[]>('user-events', [
    {
      id: 1,
      title: 'Sinh nhật mẹ',
      date: '15/02/2025',
      type: 'Sinh nhật',
      daysLeft: 12
    },
    {
      id: 2,
      title: 'Valentine',
      date: '14/02/2025',
      type: 'Lễ tình nhân',
      daysLeft: 11
    },
    {
      id: 3,
      title: 'Kỷ niệm ngày cưới',
      date: '20/03/2025',
      type: 'Kỷ niệm',
      daysLeft: 45
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventForm>({
    title: '',
    date: '',
    type: 'Sinh nhật',
    description: '',
    reminderDays: 7
  });

  const eventTypes = [
    'Sinh nhật',
    'Kỷ niệm',
    'Lễ tình nhân',
    'Ngày cưới',
    'Tốt nghiệp',
    'Thăng chức',
    'Khác'
  ];

  const calculateDaysLeft = (dateString: string): number => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date) {
      addToast({
        type: 'error',
        title: 'Thông tin chưa đầy đủ',
        description: 'Vui lòng điền đầy đủ tên sự kiện và ngày',
        duration: 3000
      });
      return;
    }

    const daysLeft = calculateDaysLeft(formData.date);
    const eventDate = new Date(formData.date);
    const formattedDate = eventDate.toLocaleDateString('vi-VN');

    if (editingEvent) {
      // Update existing event
      setEvents(prev => prev.map(event => 
        event.id === editingEvent.id 
          ? {
              ...event,
              title: formData.title,
              date: formattedDate,
              type: formData.type,
              daysLeft
            }
          : event
      ));
      
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        description: 'Sự kiện đã được cập nhật',
        duration: 3000
      });
    } else {
      // Add new event
      const newEvent: Event = {
        id: Date.now(),
        title: formData.title,
        date: formattedDate,
        type: formData.type,
        daysLeft
      };

      setEvents(prev => [...prev, newEvent]);
      
      addToast({
        type: 'success',
        title: 'Thêm thành công',
        description: 'Sự kiện mới đã được thêm',
        duration: 3000
      });
    }

    resetForm();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: new Date(event.date.split('/').reverse().join('-')).toISOString().split('T')[0],
      type: event.type,
      description: '',
      reminderDays: 7
    });
    setShowForm(true);
  };

  const handleDelete = (eventId: number) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    
    addToast({
      type: 'info',
      title: 'Đã xóa sự kiện',
      duration: 3000
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      type: 'Sinh nhật',
      description: '',
      reminderDays: 7
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'Sinh nhật':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Kỷ niệm':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Lễ tình nhân':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Ngày cưới':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const upcomingEvents = events.filter(event => event.daysLeft > 0).sort((a, b) => a.daysLeft - b.daysLeft);
  const pastEvents = events.filter(event => event.daysLeft <= 0);

  return (
    <div className="min-h-screen bg-[#fffefc]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900 font-['Poppins',Helvetica]">
                Quản lý sự kiện
              </h1>
            </div>
            <div className="ml-auto">
              <Button
                onClick={() => setShowForm(true)}
                className="bg-[#49bbbd] hover:bg-[#3a9a9c] text-white flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm sự kiện
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add/Edit Event Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-['Poppins',Helvetica]">
                {editingEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên sự kiện *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Nhập tên sự kiện"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày diễn ra *
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại sự kiện
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#49bbbd]"
                    >
                      {eventTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhắc nhở trước (ngày)
                    </label>
                    <Input
                      type="number"
                      value={formData.reminderDays}
                      onChange={(e) => setFormData({...formData, reminderDays: parseInt(e.target.value)})}
                      min="1"
                      max="365"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Thêm ghi chú cho sự kiện..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#49bbbd]"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="bg-[#49bbbd] hover:bg-[#3a9a9c] text-white"
                  >
                    {editingEvent ? 'Cập nhật' : 'Thêm sự kiện'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {events.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-24 w-24" />}
            title="Chưa có sự kiện nào"
            description="Hãy thêm những sự kiện quan trọng để không bỏ lỡ cơ hội tặng quà ý nghĩa"
            actionLabel="Thêm sự kiện đầu tiên"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="space-y-8">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Poppins',Helvetica]">
                  Sự kiện sắp tới ({upcomingEvents.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingEvents.map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{event.date}</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getEventColor(event.type)}`}>
                              {event.type}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[#49bbbd] mb-1">
                              {event.daysLeft}
                            </div>
                            <div className="text-xs text-gray-500">ngày nữa</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Gift className="h-4 w-4 mr-1" />
                              Chọn quà
                            </Button>
                            <Button size="sm" variant="outline">
                              <Bell className="h-4 w-4 mr-1" />
                              Nhắc nhở
                            </Button>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(event)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(event.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Poppins',Helvetica]">
                  Sự kiện đã qua ({pastEvents.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastEvents.map((event) => (
                    <Card key={event.id} className="opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{event.date}</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getEventColor(event.type)}`}>
                              {event.type}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Đã qua</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Button size="sm" variant="outline" disabled>
                            Đã qua
                          </Button>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(event)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(event.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};