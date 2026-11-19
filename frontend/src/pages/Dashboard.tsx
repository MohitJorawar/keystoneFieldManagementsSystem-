import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import {
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Calendar,
  MapPin,
  AlertCircle,
  Plus,
  Search,
  Wrench,
  Clock,
  ClipboardList,
  Package,
  BarChart3,
  Building,
  Check,
  Briefcase,
  AlertTriangle,
  Play,
  Pause,
  FolderPlus,
  Loader2,
  Trash2,
  Bell,
  MessageSquare,
  Mail,
  Menu,
  X
} from 'lucide-react';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  service: string;
  message: string;
  status: 'NEW' | 'READ';
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  contactEmail: string;
  phone?: string;
  currentAddress?: string;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: string;
}

interface Site {
  id: string;
  customerId: string;
  customerName: string;
  name: string;
  address: string;
}

interface Part {
  id: string;
  name: string;
  sku: string;
  unitCost: number;
  stockQty: number;
}

interface PartUsage {
  id: string;
  partId: string;
  partName: string;
  partSku: string;
  unitCost: number;
  qtyUsed: number;
  loggedAt: string;
}

interface TimeLog {
  id: string;
  technicianName: string;
  minutes: number;
  note: string;
  loggedAt: string;
}

interface StatusHistory {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedByName: string;
  changedAt: string;
  note: string;
}

interface WorkOrder {
  id: string;
  code: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
  slaDueAt: string;
  customerId: string;
  customerName: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  assignedToId: string | null;
  assignedToName: string | null;
  createdAt: string;
  partsCost: number;
  laborTimeMinutes: number;
  isSlaBreached: boolean;
  history?: StatusHistory[];
  partsUsed?: PartUsage[];
  timeLogs?: TimeLog[];
}

interface TechUser {
  id: string;
  name: string;
  email: string;
}

interface DashboardSummary {
  statusCounts: Record<string, number>;
  overdueCount: number;
  slaComplianceRate: number;
  technicianBreakdown: Record<string, number>;
  siteBreakdown: Record<string, number>;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  
  // Lists Data
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [technicians, setTechnicians] = useState<TechUser[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  const handleMarkEnquiryRead = async (enquiryId: string) => {
    try {
      await apiRequest(`/api/enquiries/${enquiryId}/read`, { method: 'PATCH' });
      setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, status: 'READ' } : e));
    } catch (err: any) {
      alert(err.message || 'Failed to mark enquiry as read');
    }
  };
  
  // Modals state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isCreateSiteOpen, setIsCreateSiteOpen] = useState(false);
  
  const [isLogPartOpen, setIsLogPartOpen] = useState(false);
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [targetCustomerId, setTargetCustomerId] = useState('');
  const [locationForm, setLocationForm] = useState({ currentAddress: '', latitude: '', longitude: '' });
  
  // Form states
  const [newOrder, setNewOrder] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    customerId: '',
    siteId: ''
  });
  const [newCustomer, setNewCustomer] = useState({ name: '', contactEmail: '', phone: '' });
  const [newSite, setNewSite] = useState({ customerId: '', name: '', address: '' });
  
  const [partLog, setPartLog] = useState({ partId: '', qtyUsed: 1 });
  const [timeLog, setTimeLog] = useState({ minutes: 30, note: '' });
  const [transitionNote, setTransitionNote] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  
  // Search / Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticated API request helper
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${user?.token}`,
      'Content-Type': 'application/json',
    };
    const targetUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const response = await fetch(targetUrl, { ...options, headers });
    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
      if (response.status === 503) {
        throw new Error('Backend service is currently suspended or starting up on Render. Please resume the service or try again in a few moments.');
      } else if (response.status === 502 || response.status === 504) {
        throw new Error('Backend server is waking up. Please wait 30 seconds and refresh.');
      }
      throw new Error(data?.message || `Request failed with status ${response.status}`);
    }
    return data;
  };

  // Initial tab setup based on user roles
  useEffect(() => {
    if (user) {
      if (user.role === 'TECHNICIAN') {
        setActiveTab('tech-jobs');
      } else if (user.role === 'CUSTOMER') {
        setActiveTab('customer-portal');
      } else if (user.role === 'DISPATCHER') {
        setActiveTab('board');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [user]);

  // Data fetching trigger
  useEffect(() => {
    if (!user) return;
    
    setError(null);
    setLoading(true);
    
    const loadData = async () => {
      try {
        if (user.role === 'MANAGER' || user.role === 'DISPATCHER') {
          // Fetch technicians
          const techs = await apiRequest('/api/work-orders/technicians');
          setTechnicians(techs);
          
          // Fetch parts
          const partsList = await apiRequest('/api/parts');
          setParts(partsList);

          // Fetch quote enquiries
          try {
            const enqs = await apiRequest('/api/enquiries');
            setEnquiries(enqs || []);
          } catch (e) {
            console.error('Error fetching enquiries', e);
          }

          // Fetch summary for dashboard tab
          if (activeTab === 'dashboard') {
            const summaryData = await apiRequest('/api/reports/summary');
            setSummary(summaryData);
          }
        }
        
        if (activeTab === 'customers') {
          const custs = await apiRequest('/api/customers');
          setCustomers(custs.content || []);
          const sitesList = await apiRequest('/api/sites');
          setSites(sitesList || []);
        }
        
        if (activeTab === 'inventory') {
          const partsList = await apiRequest('/api/parts');
          setParts(partsList);
        }

        if (activeTab === 'board' || activeTab === 'orders' || activeTab === 'tech-jobs' || activeTab === 'customer-portal') {
          const wos = await apiRequest('/api/work-orders?size=100');
          setWorkOrders(wos.content || []);
        }

        // Fetch sites lists dynamically for order modals and customer portal
        if (isCreateOrderOpen || isCreateSiteOpen || activeTab === 'customer-portal') {
          const custs = await apiRequest('/api/customers?size=100');
          setCustomers(custs.content || []);
          const sitesList = await apiRequest('/api/sites');
          setSites(sitesList || []);
        }

        // Fetch parts list dynamically when logging parts used
        if (isLogPartOpen) {
          const partsList = await apiRequest('/api/parts');
          setParts(partsList);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, user, isCreateOrderOpen, isCreateSiteOpen, isLogPartOpen]);

  // Load details of single work order
  const loadOrderDetails = async (orderId: string) => {
    try {
      const details = await apiRequest(`/api/work-orders/${orderId}`);
      setSelectedOrder(details);
      setAssigneeId(details.assignedToId || '');
      setIsDetailsOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load details');
    }
  };

  // Form Handlers
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/customers', {
        method: 'POST',
        body: JSON.stringify(newCustomer)
      });
      setIsCreateCustomerOpen(false);
      setNewCustomer({ name: '', contactEmail: '', phone: '' });
      // reload
      const custs = await apiRequest('/api/customers');
      setCustomers(custs.content || []);
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/api/customers/${newSite.customerId}/sites`, {
        method: 'POST',
        body: JSON.stringify({
          name: newSite.name,
          address: newSite.address,
          customerId: newSite.customerId
        })
      });
      setIsCreateSiteOpen(false);
      setNewSite({ customerId: '', name: '', address: '' });
      const sitesList = await apiRequest('/api/sites');
      setSites(sitesList || []);
    } catch (err: any) {
      alert(err.message || 'Failed to create site');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will also delete all associated sites and user mappings.')) return;
    try {
      await apiRequest(`/api/customers/${customerId}`, {
        method: 'DELETE'
      });
      const custs = await apiRequest('/api/customers');
      setCustomers(custs.content || []);
      const sitesList = await apiRequest('/api/sites');
      setSites(sitesList || []);
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!window.confirm('Are you sure you want to delete this site?')) return;
    try {
      await apiRequest(`/api/sites/${siteId}`, {
        method: 'DELETE'
      });
      const sitesList = await apiRequest('/api/sites');
      setSites(sitesList || []);
    } catch (err: any) {
      alert(err.message || 'Failed to delete site');
    }
  };

  const openLocationModal = (customer: Customer) => {
    setTargetCustomerId(customer.id);
    setLocationForm({
      currentAddress: customer.currentAddress || '',
      latitude: customer.latitude != null ? String(customer.latitude) : '',
      longitude: customer.longitude != null ? String(customer.longitude) : ''
    });
    setIsLocationModalOpen(true);
  };

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationForm(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
          currentAddress: prev.currentAddress || `GPS Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        }));
      },
      (err) => {
        alert('Could not detect GPS location: ' + err.message);
      },
      { timeout: 10000 }
    );
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/api/customers/${targetCustomerId}/location`, {
        method: 'PUT',
        body: JSON.stringify({
          currentAddress: locationForm.currentAddress || undefined,
          latitude: locationForm.latitude ? parseFloat(locationForm.latitude) : undefined,
          longitude: locationForm.longitude ? parseFloat(locationForm.longitude) : undefined
        })
      });

      setIsLocationModalOpen(false);
      const custs = await apiRequest('/api/customers?size=100');
      setCustomers(custs.content || []);
    } catch (err: any) {
      alert(err.message || 'Failed to update location');
    }
  };

  const handleDeleteWorkOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this work order?')) return;
    try {
      await apiRequest(`/api/work-orders/${orderId}`, {
        method: 'DELETE'
      });
      setIsDetailsOpen(false);
      const wos = await apiRequest('/api/work-orders?size=100');
      setWorkOrders(wos.content || []);
      if (activeTab === 'dashboard') {
        const summaryData = await apiRequest('/api/reports/summary');
        setSummary(summaryData);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete work order');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let orderPayload = { ...newOrder };
      let customerId = newOrder.customerId;

      if (user && user.role === 'CUSTOMER') {
        if (customers.length > 0) {
          customerId = customers[0].id;
          orderPayload.customerId = customerId;
        } else {
          throw new Error('Your customer profile is not loaded yet. Please wait a moment and try again.');
        }
      }

      // Handle GPS Location option if chosen or if GPS coordinates detected
      if (orderPayload.siteId === '__GPS__') {
        const selectedCustId = customerId || orderPayload.customerId;
        const availableSites = sites.filter(s => selectedCustId ? s.customerId === selectedCustId : true);
        const fallbackSiteId = availableSites[0]?.id || sites[0]?.id;

        if (!fallbackSiteId) {
          throw new Error('No default site available. Please select a facility site.');
        }

        // Use valid existing site ID to pass backend validation
        orderPayload.siteId = fallbackSiteId;

        // Attach live GPS Google Maps link directly into description
        if (locationForm.latitude && locationForm.longitude) {
          const lat = locationForm.latitude;
          const lng = locationForm.longitude;
          const gpsText = `\n\n📍 [Live GPS Location]: https://www.google.com/maps?q=${lat},${lng} (${lat}, ${lng})`;
          orderPayload.description = (orderPayload.description || '') + gpsText;
        }
      }

      await apiRequest('/api/work-orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      // Optionally attempt location save (non-blocking)
      if (user && user.role === 'CUSTOMER' && customerId && locationForm.currentAddress) {
        try {
          await apiRequest(`/api/customers/${customerId}/location`, {
            method: 'PUT',
            body: JSON.stringify({
              currentAddress: locationForm.currentAddress,
              latitude: locationForm.latitude ? parseFloat(locationForm.latitude) : undefined,
              longitude: locationForm.longitude ? parseFloat(locationForm.longitude) : undefined
            })
          });
        } catch {
          // Ignore location save error gracefully
        }
      }

      setIsCreateOrderOpen(false);
      setNewOrder({ title: '', description: '', priority: 'MEDIUM', customerId: '', siteId: '' });
      setLocationForm({ currentAddress: '', latitude: '', longitude: '' });

      const wos = await apiRequest('/api/work-orders?size=100');
      setWorkOrders(wos.content || []);
    } catch (err: any) {
      alert(err.message || 'Failed to create work order');
    }
  };

  const handleAssignOrder = async () => {
    if (!selectedOrder) return;
    try {
      const updated = await apiRequest(`/api/work-orders/${selectedOrder.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignedToId: assigneeId || null })
      });
      setSelectedOrder(updated);
      // reload list
      const wos = await apiRequest('/api/work-orders?size=100');
      setWorkOrders(wos.content || []);
    } catch (err: any) {
      alert(err.message || 'Failed to assign order');
    }
  };

  const handleTransitionStatus = async (status: string) => {
    if (!selectedOrder) return;
    try {
      const updated = await apiRequest(`/api/work-orders/${selectedOrder.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, note: transitionNote || null })
      });
      setSelectedOrder(updated);
      setTransitionNote('');
      // reload list
      const wos = await apiRequest('/api/work-orders?size=100');
      setWorkOrders(wos.content || []);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleLogPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const updated = await apiRequest(`/api/work-orders/${selectedOrder.id}/parts`, {
        method: 'POST',
        body: JSON.stringify(partLog)
      });
      setSelectedOrder(updated);
      setIsLogPartOpen(false);
      setPartLog({ partId: '', qtyUsed: 1 });
      // reload list
      const wos = await apiRequest('/api/work-orders?size=100');
      setWorkOrders(wos.content || []);
    } catch (err: any) {
      alert(err.message || 'Failed to log parts');
    }
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const updated = await apiRequest(`/api/work-orders/${selectedOrder.id}/time`, {
        method: 'POST',
        body: JSON.stringify(timeLog)
      });
      setSelectedOrder(updated);
      setIsLogTimeOpen(false);
      setTimeLog({ minutes: 30, note: '' });
      // reload list
      const wos = await apiRequest('/api/work-orders?size=100');
      setWorkOrders(wos.content || []);
    } catch (err: any) {
      alert(err.message || 'Failed to log labor time');
    }
  };

  if (!user) return null;

  // Filtered orders list
  const filteredOrders = workOrders.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    const matchesPriority = priorityFilter ? o.priority === priorityFilter : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const unreadEnquiriesCount = enquiries.filter(e => e.status === 'NEW').length;

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      
      {/* Mobile Top Navigation Header */}
      <header className="dashboard-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={24} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>KEYSTONE</span>
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-primary-glow)', color: 'var(--color-primary)', padding: '0.25rem 0.65rem', borderRadius: '12px' }}>
          {user.role}
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      <div
        className={`dashboard-sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside
        className={`dashboard-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={28} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              KEYSTONE <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Portal</span>
            </h2>
          </div>
          {/* Close button inside drawer for mobile */}
          <button
            className="mobile-menu-toggle mobile-close-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {(user.role === 'MANAGER' || user.role === 'DISPATCHER') && (
            <>
              {user.role === 'MANAGER' && (
                <button
                  onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }}
                  className={`btn-nav ${activeTab === 'dashboard' ? 'active' : ''}`}
                >
                  <BarChart3 size={18} />
                  Dashboard Metrics
                </button>
              )}
              <button
                onClick={() => { setActiveTab('notifications'); setIsMobileSidebarOpen(false); }}
                className={`btn-nav ${activeTab === 'notifications' ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Bell size={18} />
                  Notifications
                </span>
                {unreadEnquiriesCount > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '2px 7px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {unreadEnquiriesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('board'); setIsMobileSidebarOpen(false); }}
                className={`btn-nav ${activeTab === 'board' ? 'active' : ''}`}
              >
                <Briefcase size={18} />
                Kanban Board
              </button>
              <button
                onClick={() => { setActiveTab('orders'); setIsMobileSidebarOpen(false); }}
                className={`btn-nav ${activeTab === 'orders' ? 'active' : ''}`}
              >
                <ClipboardList size={18} />
                All Work Orders
              </button>
              <button
                onClick={() => { setActiveTab('customers'); setIsMobileSidebarOpen(false); }}
                className={`btn-nav ${activeTab === 'customers' ? 'active' : ''}`}
              >
                <Building size={18} />
                Customers & Sites
              </button>
              <button
                onClick={() => { setActiveTab('inventory'); setIsMobileSidebarOpen(false); }}
                className={`btn-nav ${activeTab === 'inventory' ? 'active' : ''}`}
              >
                <Package size={18} />
                Parts Inventory
              </button>
            </>
          )}

          {user.role === 'TECHNICIAN' && (
            <button
              onClick={() => { setActiveTab('tech-jobs'); setIsMobileSidebarOpen(false); }}
              className={`btn-nav ${activeTab === 'tech-jobs' ? 'active' : ''}`}
            >
              <Wrench size={18} />
              My Assigned Jobs
            </button>
          )}

          {user.role === 'CUSTOMER' && (
            <button
              onClick={() => { setActiveTab('customer-portal'); setIsMobileSidebarOpen(false); }}
              className={`btn-nav ${activeTab === 'customer-portal' ? 'active' : ''}`}
            >
              <UserIcon size={18} />
              Customer Service Portal
            </button>
          )}
        </nav>

        {/* User profile section at sidebar bottom */}
        <div style={{
          borderTop: '1px solid var(--glass-border)',
          paddingTop: '1.25rem',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)'
            }}>
              <UserIcon size={20} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{user.role}</div>
            </div>
          </div>
          <button onClick={logout} className="btn" style={{
            background: 'transparent',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            padding: '0.5rem 1rem'
          }}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main" style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
        {loading && (
          <div style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--color-primary)',
            boxShadow: 'var(--shadow-glow)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            color: 'var(--text-primary)',
            zIndex: 9999
          }}>
            <Loader2 className="animate-spin" size={14} />
            <span>Syncing live data...</span>
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ==================== TAB: DASHBOARD METRICS ==================== */}
        {activeTab === 'dashboard' && user.role === 'MANAGER' && summary && (
          <div>
            <div className="db-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Operations Summary</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Real-time facility management performance metrics</p>
              </div>
              <div className="db-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn" onClick={() => setIsCreateCustomerOpen(true)} style={{ width: 'auto', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                  <Plus size={18} /> New Customer
                </button>
                <button className="btn" onClick={() => setIsCreateSiteOpen(true)} style={{ width: 'auto', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                  <Plus size={18} /> New Site
                </button>
                <button className="btn btn-primary" onClick={() => setIsCreateOrderOpen(true)} style={{ width: 'auto' }}>
                  <Plus size={18} /> New Work Order
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="db-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Overdue Jobs</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 700, color: summary.overdueCount > 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{summary.overdueCount}</span>
                  {summary.overdueCount > 0 && <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Active jobs past SLA limit</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>SLA Compliance</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--color-success)' }}>{summary.slaComplianceRate.toFixed(1)}%</div>
                <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', marginTop: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ width: `${summary.slaComplianceRate}%`, height: '100%', background: 'var(--color-success)' }}></div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Active Backlog</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {(summary.statusCounts['NEW'] || 0) + (summary.statusCounts['ASSIGNED'] || 0) + (summary.statusCounts['IN_PROGRESS'] || 0) + (summary.statusCounts['ON_HOLD'] || 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Uncompleted work orders</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Completed Jobs</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                  {(summary.statusCounts['COMPLETED'] || 0) + (summary.statusCounts['CLOSED'] || 0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Jobs resolved & closed out</div>
              </div>
            </div>

            {/* Status counts bar breakdown */}
            <div className="db-split-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Work Orders by Current Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {Object.entries(summary.statusCounts).map(([status, count]) => {
                    const max = Math.max(...Object.values(summary.statusCounts), 1);
                    const pct = (count / max) * 100;
                    return (
                      <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '120px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{status}</div>
                        <div style={{ flex: 1, height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }}></div>
                        </div>
                        <div style={{ width: '40px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 700 }}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Site metrics summary list */}
              <div className="glass-card" style={{ padding: '2rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Load by Location</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
                  {Object.entries(summary.siteBreakdown).length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No data loaded</div>
                  ) : (
                    Object.entries(summary.siteBreakdown).map(([site, count]) => (
                      <div key={site} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{site}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)' }}>{count} jobs</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: NOTIFICATIONS & ENQUIRIES ==================== */}
        {activeTab === 'notifications' && (user.role === 'MANAGER' || user.role === 'DISPATCHER') && (
          <div>
            <div className="db-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Bell style={{ color: 'var(--color-primary)' }} />
                  Quote Enquiries & Notifications
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Review client quote requests submitted from the public home page</p>
              </div>
              {unreadEnquiriesCount > 0 && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: 700
                }}>
                  {unreadEnquiriesCount} New {unreadEnquiriesCount === 1 ? 'Enquiry' : 'Enquiries'}
                </div>
              )}
            </div>

            {enquiries.length === 0 ? (
              <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <MessageSquare size={54} style={{ opacity: 0.25, marginBottom: '1rem', color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Quote Enquiries Received Yet</h3>
                <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem' }}>When visitors request a quote on the public home page, their enquiries and contact details will appear here in real-time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {enquiries.map((enq) => (
                  <div 
                    key={enq.id} 
                    className="glass-card" 
                    style={{
                      padding: '1.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--glass-bg)',
                      border: enq.status === 'NEW' ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
                      boxShadow: enq.status === 'NEW' ? '0 4px 20px rgba(59, 130, 246, 0.12)' : 'none',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    <div className="db-enquiry-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: enq.status === 'NEW' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-tertiary)',
                          color: enq.status === 'NEW' ? 'var(--color-primary)' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.25rem'
                        }}>
                          {enq.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{enq.name}</h3>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.65rem',
                              borderRadius: '12px',
                              backgroundColor: enq.status === 'NEW' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                              color: enq.status === 'NEW' ? '#3b82f6' : '#9ca3af',
                              letterSpacing: '0.04em'
                            }}>
                              {enq.status === 'NEW' ? '● NEW ENQUIRY' : 'READ'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Mail size={14} /> {enq.email}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Clock size={14} /> {new Date(enq.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="db-enquiry-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                        {enq.status === 'NEW' && (
                          <button
                            onClick={() => handleMarkEnquiryRead(enq.id)}
                            className="btn"
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem',
                              background: 'var(--bg-tertiary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--glass-border)'
                            }}
                          >
                            <Check size={15} /> Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setNewOrder(prev => ({
                              ...prev,
                              title: `Quote Request: ${enq.service}`,
                              description: `Client: ${enq.name} (${enq.email})\nService: ${enq.service}\nEnquiry Details:\n${enq.message}`
                            }));
                            setIsCreateOrderOpen(true);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          <Plus size={15} /> Create Work Order
                        </button>
                      </div>
                    </div>

                    <div style={{
                      background: 'var(--bg-tertiary)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '4px solid var(--color-primary)'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                        Service Requested: {enq.service}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {enq.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: KANBAN BOARD ==================== */}
        {activeTab === 'board' && (
          <div>
            <div className="db-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Service Board</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Track and move service jobs through the lifecycle</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsCreateOrderOpen(true)} style={{ width: 'auto' }}>
                <Plus size={18} /> Add Work Order
              </button>
            </div>

            {/* Kanban columns wrapper */}
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', minHeight: '600px' }}>
              {(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'] as const).map(status => {
                const statusOrders = workOrders.filter(o => o.status === status);
                return (
                  <div key={status} style={{
                    flex: '0 0 280px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid var(--glass-border)'
                    }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{status}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'var(--bg-tertiary)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '10px'
                      }}>{statusOrders.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
                      {statusOrders.map(o => (
                        <div
                          key={o.id}
                          onClick={() => loadOrderDetails(o.id)}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1rem',
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>{o.code}</span>
                            <span style={{
                              fontWeight: 700,
                              color: o.priority === 'EMERGENCY' ? 'var(--color-danger)' : o.priority === 'HIGH' ? 'var(--color-warning)' : 'var(--text-secondary)'
                            }}>{o.priority}</span>
                          </div>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{o.title}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <Building size={12} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customerName}</span>
                          </div>

                          {o.assignedToName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                              <UserIcon size={12} />
                              <span>{o.assignedToName}</span>
                            </div>
                          )}

                          {o.isSlaBreached && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: 'white',
                              background: 'var(--color-danger)',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              marginTop: '0.75rem'
                            }}>
                              <AlertCircle size={10} /> SLA BREACHED
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB: ALL WORK ORDERS ==================== */}
        {activeTab === 'orders' && (
          <div>
            <div className="db-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Work Orders</h1>
                <p style={{ color: 'var(--text-secondary)' }}>View and search all logged service cases</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsCreateOrderOpen(true)} style={{ width: 'auto' }}>
                <Plus size={18} /> Add Work Order
              </button>
            </div>

            {/* Filter controls */}
            <div className="db-filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by title, code, or customer..."
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-input"
                style={{ width: '160px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                className="form-input"
                style={{ width: '160px' }}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            {/* Table layout */}
            <div className="glass-card db-table-wrapper" style={{ padding: '0', overflow: 'hidden', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Code</th>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Title</th>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer</th>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority</th>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Assignee</th>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SLA Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No work orders found matching filters
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(o => (
                      <tr
                        key={o.id}
                        onClick={() => loadOrderDetails(o.id)}
                        style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{o.code}</td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>{o.title}</td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                          <div>{o.customerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.siteName}</div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: o.priority === 'EMERGENCY' ? 'var(--color-danger)' : o.priority === 'HIGH' ? 'var(--color-warning)' : 'var(--text-secondary)'
                          }}>{o.priority}</span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: o.status === 'COMPLETED' || o.status === 'CLOSED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                            color: o.status === 'COMPLETED' || o.status === 'CLOSED' ? 'var(--color-success)' : 'var(--color-primary)'
                          }}>{o.status}</span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: o.assignedToName ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {o.assignedToName || 'Unassigned'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                          {o.isSlaBreached ? (
                            <span style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.75rem' }}>BREACHED</span>
                          ) : (
                            <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.75rem' }}>OK</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB: CUSTOMERS & SITES ==================== */}
        {activeTab === 'customers' && (
          <div>
            <div className="db-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Customer Management</h1>
                <p style={{ color: 'var(--text-secondary)' }}>View client profiles and manage associated equipment sites</p>
              </div>
              <div className="db-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => setIsCreateCustomerOpen(true)} style={{ width: 'auto' }}>
                  <Plus size={18} /> Add Customer
                </button>
                <button className="btn btn-primary" onClick={() => setIsCreateSiteOpen(true)} style={{ width: 'auto' }}>
                  <Plus size={18} /> Add Site
                </button>
              </div>
            </div>

            <div className="db-split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Customers list */}
              <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Active Customers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {customers.map(c => (
                    <div key={c.id} style={{
                      padding: '1rem',
                      background: 'rgba(0, 0, 0, 0.15)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Email: {c.contactEmail}</div>
                        {c.phone && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>📞 {c.phone}</div>
                        )}
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={14} />
                          <span>{c.currentAddress || 'Live location: Not set'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={() => openLocationModal(c)}
                        >
                          <MapPin size={12} /> Set Location
                        </button>
                        {user.role === 'MANAGER' && (
                          <button
                            onClick={() => handleDeleteCustomer(c.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.2s'
                            }}
                            title="Delete Customer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sites list */}
              <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Sites / Locations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {sites.map(s => (
                    <div key={s.id} style={{
                      padding: '1rem',
                      background: 'rgba(0, 0, 0, 0.15)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase' }}>Client: {s.customerName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                          <MapPin size={14} />
                          <span>{s.address}</span>
                        </div>
                      </div>
                      {user.role === 'MANAGER' && (
                        <button
                          onClick={() => handleDeleteSite(s.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s'
                          }}
                          title="Delete Site"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: PARTS INVENTORY ==================== */}
        {activeTab === 'inventory' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Inventory & Parts</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Track replacement stocks and billing costs</p>
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SKU</th>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Part Name</th>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit Cost</th>
                    <th style={{ padding: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Stock Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-accent)' }}>{p.sku}</td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>${p.unitCost.toFixed(2)}</td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: p.stockQty < 10 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: p.stockQty < 10 ? 'var(--color-danger)' : 'var(--color-success)'
                        }}>{p.stockQty} remaining</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB: MY JOBS (TECHNICIAN VIEW) ==================== */}
        {activeTab === 'tech-jobs' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' }}>My Assigned Jobs</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Manage your active service orders and log components</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filteredOrders.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No active work orders assigned to you.
                </div>
              ) : (
                filteredOrders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => loadOrderDetails(o.id)}
                    className="glass-card"
                    style={{
                      padding: '1.5rem',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{o.code}</span>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.6875rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--color-primary)'
                      }}>{o.status}</span>
                    </div>

                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{o.title}</h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '1rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>{o.description}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Building size={14} />
                        <span>{o.customerName} - {o.siteName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} />
                        <span>{o.siteAddress}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} />
                        <span>SLA Due: {new Date(o.slaDueAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: CUSTOMER PORTAL ==================== */}
        {activeTab === 'customer-portal' && (
          <div>
            <div className="db-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Customer Portal</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Request facilities maintenance and track live case updates</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsCreateOrderOpen(true)} style={{ width: 'auto' }}>
                <Plus size={18} /> Request Service
              </button>
            </div>


            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active Service Tickets</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No active service tickets submitted.
                </div>
              ) : (
                filteredOrders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => loadOrderDetails(o.id)}
                    className="glass-card"
                    style={{
                      padding: '1.5rem',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{o.code}</span>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--color-primary)'
                      }}>{o.status}</span>
                    </div>

                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{o.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{o.description}</p>

                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.8125rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} />
                        <span>Site: {o.siteName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} />
                        <span>Submitted on: {new Date(o.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* ==================== MODAL: WORK ORDER DETAILS ==================== */}
      {isDetailsOpen && selectedOrder && (
        <div className="db-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card db-modal-content" style={{
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsDetailsOpen(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.25rem'
              }}
            >
              &times;
            </button>

            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{selectedOrder.code}</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedOrder.title}</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--color-primary)'
                }}>{selectedOrder.status}</span>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: selectedOrder.priority === 'EMERGENCY' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedOrder.priority === 'EMERGENCY' ? 'var(--color-danger)' : 'var(--text-primary)'
                }}>{selectedOrder.priority}</span>
                {user.role === 'MANAGER' && (
                  <button
                    onClick={() => handleDeleteWorkOrder(selectedOrder.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      transition: 'color 0.2s'
                    }}
                    title="Delete Work Order"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                )}
              </div>
            </div>

            {/* Columns split */}
            <div className="db-modal-split" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Description</h4>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>{selectedOrder.description}</p>

                {/* Status operations buttons for Technician */}
                {user.role === 'TECHNICIAN' && selectedOrder.assignedToId === user.id && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {selectedOrder.status === 'ASSIGNED' && (
                      <button className="btn btn-primary" onClick={() => handleTransitionStatus('IN_PROGRESS')} style={{ background: 'var(--color-success)', width: 'auto' }}>
                        <Play size={16} /> Start Job
                      </button>
                    )}
                    {selectedOrder.status === 'IN_PROGRESS' && (
                      <>
                        <button className="btn btn-primary" onClick={() => handleTransitionStatus('ON_HOLD')} style={{ background: 'var(--color-warning)', width: 'auto' }}>
                          <Pause size={16} /> Hold Job
                        </button>
                        <button className="btn btn-primary" onClick={() => handleTransitionStatus('COMPLETED')} style={{ background: 'var(--color-success)', width: 'auto' }}>
                          <Check size={16} /> Complete Job
                        </button>
                      </>
                    )}
                    {selectedOrder.status === 'ON_HOLD' && (
                      <button className="btn btn-primary" onClick={() => handleTransitionStatus('IN_PROGRESS')} style={{ background: 'var(--color-success)', width: 'auto' }}>
                        <Play size={16} /> Resume Job
                      </button>
                    )}
                  </div>
                )}

                {/* Custom status logs & lists */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Audit Trail (History)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedOrder.history?.map(h => (
                      <div key={h.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem' }}>
                        <div style={{ color: 'var(--text-muted)', minWidth: '110px' }}>{new Date(h.changedAt).toLocaleString()}</div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.changedByName}</span>: transitioned to <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{h.toStatus}</span>
                          {h.note && <div style={{ color: 'var(--text-secondary)', marginTop: '0.15rem', fontStyle: 'italic' }}>"{h.note}"</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar metadata info inside modal */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Client</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedOrder.customerName}</div>
                </div>
              <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Location (Site)</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedOrder.siteName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <MapPin size={12} /> {selectedOrder.siteAddress}
                  </div>

                  {/* Customer Live Location — open in Google Maps */}
                  {(() => {
                    const cust = customers.find(c => c.id === selectedOrder.customerId);
                    let gpsUrl = '';
                    if (cust?.latitude && cust?.longitude) {
                      gpsUrl = `https://www.google.com/maps?q=${cust.latitude},${cust.longitude}`;
                    } else if (selectedOrder.description) {
                      const match = selectedOrder.description.match(/https:\/\/www\.google\.com\/maps\?q=([0-9.-]+),([0-9.-]+)/);
                      if (match) {
                        gpsUrl = match[0];
                      }
                    }

                    if (gpsUrl) {
                      return (
                        <a
                          href={gpsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            marginTop: '0.65rem',
                            padding: '0.4rem 0.85rem',
                            background: 'rgba(34,197,94,0.12)',
                            border: '1px solid rgba(34,197,94,0.35)',
                            borderRadius: '6px',
                            color: '#22c55e',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.22)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.12)')}
                          title="Click to view live customer location on Google Maps"
                        >
                          <MapPin size={13} />
                          View Customer Live Location
                        </a>
                      );
                    }
                    if (cust?.currentAddress) {
                      return (
                        <a
                          href={`https://www.google.com/maps/search/${encodeURIComponent(cust.currentAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            marginTop: '0.65rem',
                            padding: '0.4rem 0.85rem',
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.25)',
                            borderRadius: '6px',
                            color: 'var(--color-primary)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                        >
                          <MapPin size={13} />
                          Open Customer Address in Maps
                        </a>
                      );
                    }
                    return (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        No live location shared by customer
                      </div>
                    );
                  })()}
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>SLA Commitment</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: selectedOrder.isSlaBreached ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                    {new Date(selectedOrder.slaDueAt).toLocaleString()}
                  </div>
                  {selectedOrder.isSlaBreached && (
                    <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.25rem' }}>[OVERDUE]</div>
                  )}
                </div>

                {/* Assign Technician logic (For manager/dispatcher) */}
                {(user.role === 'MANAGER' || user.role === 'DISPATCHER') && (selectedOrder.status !== 'CLOSED' && selectedOrder.status !== 'CANCELLED') && (
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Assign Technician</label>
                    <select
                      className="form-input"
                      style={{ padding: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.5rem' }}
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button className="btn btn-primary" onClick={handleAssignOrder} style={{ padding: '0.5rem', fontSize: '0.8125rem' }}>
                      Update Assignee
                    </button>
                  </div>
                )}

                {/* Dispatcher/Manager status transition tool */}
                {(user.role === 'MANAGER' || user.role === 'DISPATCHER') && (selectedOrder.status !== 'CLOSED' && selectedOrder.status !== 'CANCELLED') && (
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Update Status</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add change note..."
                      style={{ padding: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.5rem' }}
                      value={transitionNote}
                      onChange={(e) => setTransitionNote(e.target.value)}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                      {selectedOrder.status === 'COMPLETED' && user.role === 'MANAGER' && (
                        <button className="btn" onClick={() => handleTransitionStatus('CLOSED')} style={{ background: 'var(--color-success)', color: 'white', padding: '0.4rem', fontSize: '0.75rem' }}>
                          Close Job
                        </button>
                      )}
                      {selectedOrder.status === 'NEW' && (
                        <button className="btn" onClick={() => handleTransitionStatus('CANCELLED')} style={{ background: 'var(--color-danger)', color: 'white', padding: '0.4rem', fontSize: '0.75rem' }}>
                          Cancel Job
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Logging Parts and Time logs tables */}
            <div className="db-modal-subsplit" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Parts Logged</h4>
                  {(user.role === 'MANAGER' || (user.role === 'TECHNICIAN' && selectedOrder.assignedToId === user.id)) && (selectedOrder.status !== 'CLOSED' && selectedOrder.status !== 'CANCELLED') && (
                    <button onClick={() => setIsLogPartOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <Plus size={14} /> Log Part
                    </button>
                  )}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '0.5rem' }}>Part SKU</th>
                      <th style={{ padding: '0.5rem' }}>Qty</th>
                      <th style={{ padding: '0.5rem' }}>Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.partsUsed?.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>No parts logged</td></tr>
                    ) : (
                      selectedOrder.partsUsed?.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '0.5rem' }}>
                            <div>{u.partName}</div>
                            <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{u.partSku}</span>
                          </td>
                          <td style={{ padding: '0.5rem' }}>{u.qtyUsed}</td>
                          <td style={{ padding: '0.5rem' }}>${u.unitCost.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div style={{ marginTop: '0.75rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem' }}>
                  Total Parts Cost: <span style={{ color: 'var(--color-accent)' }}>${selectedOrder.partsCost.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Labor Logged</h4>
                  {(user.role === 'MANAGER' || (user.role === 'TECHNICIAN' && selectedOrder.assignedToId === user.id)) && (selectedOrder.status !== 'CLOSED' && selectedOrder.status !== 'CANCELLED') && (
                    <button onClick={() => setIsLogTimeOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <Plus size={14} /> Log Time
                    </button>
                  )}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '0.5rem' }}>Tech</th>
                      <th style={{ padding: '0.5rem' }}>Duration</th>
                      <th style={{ padding: '0.5rem' }}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.timeLogs?.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>No time logged</td></tr>
                    ) : (
                      selectedOrder.timeLogs?.map(l => (
                        <tr key={l.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{l.technicianName}</td>
                          <td style={{ padding: '0.5rem' }}>{l.minutes} min</td>
                          <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{l.note || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div style={{ marginTop: '0.75rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem' }}>
                  Total Labor Time: <span style={{ color: 'var(--color-accent)' }}>{selectedOrder.laborTimeMinutes} mins</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== MODAL: CREATE WORK ORDER ==================== */}
      {isCreateOrderOpen && (
        <div className="db-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 101,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card db-modal-content" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderPlus size={20} style={{ color: 'var(--color-primary)' }} />
              Request Facilities Service
            </h3>
            
            <form onSubmit={handleCreateOrder}>
              <div className="form-group">
                <label className="form-label">Issue Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Main HVAC unit blowing hot air"
                  className="form-input"
                  value={newOrder.title}
                  onChange={(e) => setNewOrder({ ...newOrder, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description & Symptoms</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Please write diagnostic details..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                  value={newOrder.description}
                  onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-input"
                  value={newOrder.priority}
                  onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                >
                  <option value="LOW">Low (7 Days SLA)</option>
                  <option value="MEDIUM">Medium (3 Days SLA)</option>
                  <option value="HIGH">High (24 Hours SLA)</option>
                  <option value="EMERGENCY">Emergency (4 Hours SLA)</option>
                </select>
              </div>

              {/* If manager/dispatcher, select customer first */}
              {user.role !== 'CUSTOMER' ? (
                <div className="form-group">
                  <label className="form-label">Customer</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      className="form-input"
                      required
                      value={newOrder.customerId}
                      onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value, siteId: '' })}
                      style={{ flex: 1 }}
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn"
                      style={{ width: 'auto', padding: '0 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                      onClick={() => setIsCreateCustomerOpen(true)}
                    >
                      + New
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="form-group" style={{ marginBottom: user.role === 'CUSTOMER' ? '1rem' : '2rem' }}>
                <label className="form-label">Facility Site</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    className="form-input"
                    required
                    value={newOrder.siteId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__GPS__') {
                        if (!navigator.geolocation) {
                          alert('Geolocation is not supported by your browser.');
                          return;
                        }
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lat = pos.coords.latitude.toFixed(6);
                            const lng = pos.coords.longitude.toFixed(6);
                            const gpsLabel = `GPS Location (${lat}, ${lng})`;
                            setLocationForm({ currentAddress: gpsLabel, latitude: lat, longitude: lng });
                            // Keep dropdown showing the GPS option
                            setNewOrder({ ...newOrder, siteId: '__GPS__' });
                          },
                          (err) => {
                            alert('Could not detect GPS: ' + err.message);
                            setNewOrder({ ...newOrder, siteId: '' });
                          },
                          { timeout: 10000 }
                        );
                      } else {
                        setLocationForm({ currentAddress: '', latitude: '', longitude: '' });
                        setNewOrder({ ...newOrder, siteId: val });
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Location</option>
                    <option value="__GPS__">📍 Use Current Location (GPS)</option>
                    {/* Filter sites list for selected customer */}
                    {sites.filter(s => {
                      const selectedCustId = user.role === 'CUSTOMER' ? (customers[0]?.id || '') : newOrder.customerId;
                      return selectedCustId ? s.customerId === selectedCustId : true;
                    }).map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {s.address}</option>
                    ))}
                  </select>
                  {user.role !== 'CUSTOMER' && (
                    <button
                      type="button"
                      className="btn"
                      style={{ width: 'auto', padding: '0 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', fontSize: '0.875rem' }}
                      onClick={() => {
                        if (newOrder.customerId) {
                          setNewSite({ ...newSite, customerId: newOrder.customerId });
                          setIsCreateSiteOpen(true);
                        } else {
                          alert('Please select a customer first before creating a site.');
                        }
                      }}
                    >
                      + New
                    </button>
                  )}
                </div>
                {/* Show GPS coordinates when GPS option is selected */}
                {newOrder.siteId === '__GPS__' && locationForm.latitude && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.6rem',
                    padding: '0.5rem 0.85rem',
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: '6px',
                    fontSize: '0.78rem'
                  }}>
                    <span style={{ color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={13} />
                      {locationForm.latitude}, {locationForm.longitude}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${locationForm.latitude},${locationForm.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'underline' }}
                    >
                      Open in Maps ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Current Location capture — CUSTOMER only */}
              {user.role === 'CUSTOMER' && (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                      Share My Current Location
                      <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                    </label>
                    <button
                      type="button"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      onClick={() => {
                        if (!navigator.geolocation) {
                          alert('Geolocation not supported by your browser.');
                          return;
                        }
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            setLocationForm({
                              currentAddress: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                              latitude: lat.toFixed(6),
                              longitude: lng.toFixed(6)
                            });
                            if (customers.length > 0) setTargetCustomerId(customers[0].id);
                          },
                          (err) => alert('Could not detect location: ' + err.message),
                          { timeout: 10000 }
                        );
                      }}
                    >
                      <MapPin size={12} /> Detect GPS
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter address or click Detect GPS…"
                    className="form-input"
                    style={{ fontSize: '0.8125rem', marginBottom: 0 }}
                    value={locationForm.currentAddress}
                    onChange={(e) => {
                      setLocationForm(prev => ({ ...prev, currentAddress: e.target.value }));
                      if (customers.length > 0) setTargetCustomerId(customers[0].id);
                    }}
                  />
                  {locationForm.latitude && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      📍 Coordinates: {locationForm.latitude}, {locationForm.longitude}
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }} onClick={() => setIsCreateOrderOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREATE CUSTOMER ==================== */}
      {isCreateCustomerOpen && (
        <div className="db-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 101,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card db-modal-content" style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Add Customer Profile</h3>
            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label className="form-label">Customer / Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Initech Corp"
                  className="form-input"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="billing@initech.com"
                  className="form-input"
                  value={newCustomer.contactEmail}
                  onChange={(e) => setNewCustomer({ ...newCustomer, contactEmail: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Phone Number <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>(optional)</span></label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  className="form-input"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }} onClick={() => setIsCreateCustomerOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREATE SITE ==================== */}
      {isCreateSiteOpen && (
        <div className="db-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 101,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card db-modal-content" style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Add Service Site</h3>
            <form onSubmit={handleCreateSite}>
              <div className="form-group">
                <label className="form-label">Customer Profile</label>
                <select
                  className="form-input"
                  required
                  value={newSite.customerId}
                  onChange={(e) => setNewSite({ ...newSite, customerId: e.target.value })}
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Site Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Headquarters Office"
                  className="form-input"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Full Address</label>
                <input
                  type="text"
                  required
                  placeholder="555 Elm St, Suite 100, City, ST"
                  className="form-input"
                  value={newSite.address}
                  onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }} onClick={() => setIsCreateSiteOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: LOG PART ==================== */}
      {isLogPartOpen && (
        <div className="db-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 102,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card db-modal-content" style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Log Part Consumption</h3>
            <form onSubmit={handleLogPart}>
              <div className="form-group">
                <label className="form-label">Select Part</label>
                <select
                  className="form-input"
                  required
                  value={partLog.partId}
                  onChange={(e) => setPartLog({ ...partLog, partId: e.target.value })}
                >
                  <option value="">Choose Component</option>
                  {parts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku}) [Stock: {p.stockQty}]</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Quantity Consumed</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="form-input"
                  value={partLog.qtyUsed}
                  onChange={(e) => setPartLog({ ...partLog, qtyUsed: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }} onClick={() => setIsLogPartOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: LOG TIME ==================== */}
      {isLogTimeOpen && (
        <div className="db-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 102,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card db-modal-content" style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Log Labor Hours</h3>
            <form onSubmit={handleLogTime}>
              <div className="form-group">
                <label className="form-label">Time Spent (Minutes)</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="form-input"
                  value={timeLog.minutes}
                  onChange={(e) => setTimeLog({ ...timeLog, minutes: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Work Summary / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Diagnosed wiring issue and replaced fuses"
                  className="form-input"
                  value={timeLog.note}
                  onChange={(e) => setTimeLog({ ...timeLog, note: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }} onClick={() => setIsLogTimeOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Labor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: UPDATE REAL-TIME LOCATION ==================== */}
      {isLocationModalOpen && (
        <div className="db-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 105,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card db-modal-content" style={{ maxWidth: '450px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} style={{ color: 'var(--color-primary)' }} />
              Update Real-Time Location
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Enter current address or auto-detect GPS coordinates to broadcast live customer position across all dashboards.
            </p>

            <form onSubmit={handleSaveLocation}>
              <div className="form-group">
                <label className="form-label">Current Address / Facility Tag</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100 Main St, Building B / Tech Hub"
                  className="form-input"
                  value={locationForm.currentAddress}
                  onChange={(e) => setLocationForm({ ...locationForm, currentAddress: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 37.7749"
                    className="form-input"
                    value={locationForm.latitude}
                    onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. -122.4194"
                    className="form-input"
                    value={locationForm.longitude}
                    onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={handleDetectGpsLocation}
                >
                  <MapPin size={16} /> Auto-Detect GPS Location
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }} onClick={() => setIsLocationModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
