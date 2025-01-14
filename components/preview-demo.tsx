'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, ChevronDown, ChevronUp, Pin, CheckCircle2, Home, Navigation, MapPin, Send, X, Reply } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Checkbox } from "@/components/ui/checkbox"

type View = 'login' | 'home' | 'forgotPassword' | 'messages' | 'tasks' | 'maps' | 'openCall'
type TaskCategory = 'new' | 'inProgress' | 'closed'

interface Message {
  id: number
  sender: string
  content: string
  unread: boolean
  isPinned?: boolean
  replies?: string[]
}

interface Task {
  id: number
  title: string
  description: string
  status: 'pending' | 'completed'
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  category: TaskCategory
}

interface ServiceProvider {
  id: number
  name: string
}

interface ColoredPoint {
  position: [number, number]
  color: string
}

export default function PreviewDemo() {
  const [view, setView] = useState<View>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUnread, setFilterUnread] = useState(false)
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all')
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [showWazePopup, setShowWazePopup] = useState(false)
  const [routeStart, setRouteStart] = useState('')
  const [routeEnd, setRouteEnd] = useState('')
  const [calculatedRoute, setCalculatedRoute] = useState<[number, number][]>([])
  const [callMessage, setCallMessage] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null)
  const [selectedServiceProvider, setSelectedServiceProvider] = useState('')
  const [identifiedInjured, setIdentifiedInjured] = useState(false)
  const [needEvacuation, setNeedEvacuation] = useState(false)
  const [dangerousLocation, setDangerousLocation] = useState(false)
  const [clearPath, setClearPath] = useState(false)
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [replyContents, setReplyContents] = useState<{ [key: number]: string }>({})
  const [mapType, setMapType] = useState<'street' | 'topographic'>('street')
  const [injuryTypes, setInjuryTypes] = useState<string[]>([])
  const [dangerousLocationTypes, setDangerousLocationTypes] = useState<string[]>([])
  const [evacuationType, setEvacuationType] = useState('')
  const [selectedTaskLocation, setSelectedTaskLocation] = useState<[number, number] | null>(null);

  const coloredPoints: ColoredPoint[] = [
    { position: [31.2530, 34.7915], color: 'red' },
    { position: [31.2627, 34.8106], color: 'blue' },
    { position: [31.2621, 34.8011], color: 'yellow' },
    { position: [31.2550, 34.7935], color: 'red' },
    { position: [31.2610, 34.8050], color: 'blue' },
    { position: [31.2590, 34.7990], color: 'yellow' },
    { position: [31.2570, 34.7970], color: 'red' },
    { position: [31.2640, 34.8030], color: 'blue' },
    { position: [31.2600, 34.8070], color: 'yellow' },
  ]

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      sender: 'חמ"ל', 
      content: 'מצב החירום הוכרז באזור הצפון. כל הצוותים מתבקשים להיות בכוננות גבוהה. יש לעקוב אחר ההנחיות המתעדכנות בזמן אמת.',
      unread: true,
      isPinned: true,
      replies: []
    },
    { 
      id: 2, 
      sender: 'מד"א צוות 1', 
      content: 'התקבל דיווח על מספר פצועים באזור מרכז העיר. צוות 1 בדרך לטפל במקרה. נדרשת תגבורת של צוות נוסף.',
      unread: false,
      replies: []
    },
    { 
      id: 3, 
      sender: 'משטרה צוות 3', 
      content: 'אנו מבקשים סיוע בפינוי אזרחים מאזור הסכנה. נדרשים כלי רכב נוספים ואנשי צוות לעזרה בפינוי.',
      unread: true,
      replies: []
    },
  ])

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'פינוי אזרחים',
      description: 'פינוי דחוף של אזרחים מאזור הסכנה בצפון העיר',
      status: 'pending',
      priority: 'high',
      dueDate: '2025-01-06',
      category: 'new'
    },
    {
      id: 2,
      title: 'הקמת תחנת עזרה ראשונה',
      description: 'הקמת תחנת עזרה ראשונה זמנית במרכז העיר',
      status: 'completed',
      priority: 'medium',
      dueDate: '2025-01-05',
      category: 'inProgress'
    },
    {
      id: 3,
      title: 'חלוקת מזון וציוד',
      description: 'חלוקת מזון וציוד חירום לתושבים המפונים',
      status: 'pending',
      priority: 'medium',
      dueDate: '2025-01-07',
      category: 'inProgress'
    },
    {
      id: 4,
      title: 'סיום טיפול באירוע שריפה',
      description: 'סיכום פעולות כיבוי והערכת נזקים לאחר השריפה בדרום העיר',
      status: 'completed',
      priority: 'low',
      dueDate: '2025-01-04',
      category: 'closed'
    },
  ])

  const serviceProviders: ServiceProvider[] = [
    { id: 1, name: 'חמ"ל' },
    { id: 2, name: 'משטרה' },
    { id: 3, name: 'מד"א' },
    { id: 4, name: 'כיבוי אש' },
    { id: 5, name: 'פיקוד העורף' },
  ]

  useEffect(() => {
    if (view === 'maps') {
      setCalculatedRoute([])
      setRouteStart('')
      setRouteEnd('')
    }
  }, [view])

  useEffect(() => {
    if (view !== 'maps') {
      setSelectedTaskLocation(null);
    }
  }, [view]);

  const toggleDialog = (open: boolean) => {
    setDialogOpen(open);
    setIsMapVisible(!open);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username && password) {
      setLoggedInUser(username)
      setView('home')
      setUsername('')
      setPassword('')
    }
  }

  const handleForgotPassword = () => {
    setView('forgotPassword')
  }

  const handleSendNewPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (username && idNumber) {
      console.log('Sending new password for:', username, idNumber)
      setUsername('')
      setIdNumber('')
      setView('login')
    }
  }

  const handleBackToHome = () => {
    setView('home')
  }

  const handleSwitchUser = () => {
    setLoggedInUser('')
    setUsername('')
    setPassword('')
    setView('login')
    setDialogOpen(false)
  }

  const menuItems = [
    { id: 1, title: 'עדכונים ומשימות', view: 'tasks' as View },
    { id: 2, title: 'הודעות', view: 'messages' as View },
    { id: 3, title: 'פתיחת קריאה', view: 'openCall' as View },
    { id: 4, title: 'מפות', view: 'maps' as View },
    { id: 5, title: 'החלף משתמש', action: handleSwitchUser },
  ]

  const filteredMessages = messages.filter(message => 
    (!filterUnread || (filterUnread && message.unread)) &&
    message.sender.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTasks = tasks.filter(task => 
    (filterCategory === 'all' || task.category === filterCategory) &&
    (task.title.includes(searchQuery) || task.description.includes(searchQuery))
  )

  const toggleMessageExpansion = (id: number) => {
    if (expandedMessageId === id) {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === id ? { ...msg, unread: false } : msg
        )
      )
      setExpandedMessageId(null)
    } else {
      setExpandedMessageId(id)
    }
    setReplyContents(prev => ({...prev, [id]: ''}))
  }

  const toggleTaskExpansion = (id: number) => {
    setExpandedTaskId(expandedTaskId === id ? null : id)
  }

  const handleReply = (messageId: number) => {
    const replyContent = replyContents[messageId]
    if (replyContent && replyContent.trim()) {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, replies: [...(msg.replies || []), replyContent], unread: false }
            : msg
        )
      )
      setReplyContents(prev => ({ ...prev, [messageId]: '' }))
      setExpandedMessageId(messageId)
    }
  }

  const renderMessage = (message: Message) => (
    <div 
      key={message.id} 
      className={`p-2 border rounded ${message.unread ? 'bg-blue-50' : ''} ${message.isPinned ? 'bg-yellow-50 border-yellow-500' : ''}`}
    >
      <div className="flex justify-between items-center">
        <div className="font-bold text-right flex items-center">
          {message.isPinned && <Pin className="w-4 h-4 ml-1" />}
          {message.sender}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleMessageExpansion(message.id)}
        >
          {expandedMessageId === message.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
      <div className="mt-2 text-right">{message.content}</div>
      {expandedMessageId === message.id && message.replies && message.replies.length > 0 && (
        <div className="mt-2">
          <h4 className="font-semibold text-right">תגובות:</h4>
          {message.replies.map((reply, index) => (
            <div key={index} className="text-right text-sm mt-1 bg-gray-100 p-2 rounded">
              {reply}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center mt-2">
        <Input
          type="text"
          placeholder="הקלד תגובה..."
          value={replyContents[message.id] || ''}
          onChange={(e) => setReplyContents(prev => ({ ...prev, [message.id]: e.target.value }))}
          className="flex-grow text-right"
        />
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            handleReply(message.id);
          }} 
          className="mr-2"
        >
          <Reply className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  const renderTask = (task: Task) => (
    <div 
      key={task.id} 
      className={`p-2 border rounded ${
        task.category === 'new' ? 'bg-red-50' :
        task.category === 'inProgress' ? 'bg-yellow-50' :
        'bg-green-50'
      } cursor-pointer`}
      onClick={() => toggleTaskExpansion(task.id)}
    >
      <div className="flex justify-between items-center">
        <div className="font-bold text-right flex items-center">
          {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 ml-1 text-green-500" />}
          {task.title}
          {task.title === 'פינוי אזרחים' && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 text-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTaskLocation([31.2530, 34.7915]); // Example coordinates
                setView('maps');
              }}
            >
              <MapPin className="w-4 h-4" />
            </Button>
          )}
        </div>
        {expandedTaskId === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>
      {expandedTaskId === task.id && (
        <div className="mt-2 text-right">
          <p>{task.description}</p>
          <p>עדיפות: {task.priority === 'high' ? 'גבוהה' : task.priority === 'medium' ? 'בינונית' : 'נמוכה'}</p>
          <p>תאריך יעד: {task.dueDate}</p>
          <p>סטטוס: {
            task.category === 'new' ? 'חדש' :
            task.category === 'inProgress' ? 'בביצוע' :
            'אירוע שנסגר'
          }</p>
        </div>
      )}
    </div>
  )

  const renderTasksByCategory = () => {
    if (filterCategory === 'all') {
      return (
        <div className="space-y-2">
          {filteredTasks.map(renderTask)}
        </div>
      )
    }

    const categories: { [key in TaskCategory]: string } = {
      new: 'חדש',
      inProgress: 'בביצוע',
      closed: 'אירוע שנסגר'
    }

    return (
      <div key={filterCategory} className="space-y-2">
        {filteredTasks.map(renderTask)}
      </div>
    )
  }

  const handleRouteSearch = () => {
    const dummyRoute: [number, number][] = [
      [31.2530, 34.7915],
      [31.2627, 34.8106],
      [31.2621, 34.8011],
      [31.2729, 34.7885],
    ]
    setCalculatedRoute(dummyRoute)
  }

  const handleClearRoute = () => {
    setCalculatedRoute([])
    setRouteStart('')
    setRouteEnd('')
  }

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setSelectedLocation([e.latlng.lat, e.latlng.lng])
      },
    })
    return selectedLocation ? (
      <Marker position={selectedLocation}>
        <Popup>המיקום שנבחר</Popup>
      </Marker>
    ) : null
  }

  const renderMap = () => (
    <div className={`relative h-64 bg-gray-100 rounded-lg border overflow-hidden ${dialogOpen ? 'hidden' : ''}`}>
      <MapContainer center={selectedTaskLocation || [31.2530, 34.7915]} zoom={13} style={{ height: '100%', width: '100%' }}>
        {mapType === 'street' ? (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
          />
        )}
        {coloredPoints.map((point, index) => (
          <Marker
            key={index}
            position={point.position}
            icon={L.divIcon({
              className: 'custom-icon',
              html: `<div style="background-color: ${point.color}; width: 10px; height: 10px; border-radius: 50%;"></div>`,
            })}
          />
        ))}
        {selectedTaskLocation && (
          <Marker position={selectedTaskLocation}>
            <Popup>מיקום המשימה</Popup>
          </Marker>
        )}
        <LocationMarker />
        {calculatedRoute.length > 0 && <Polyline positions={calculatedRoute} color="blue" />}
      </MapContainer>
    </div>
  )

  const handleOpenCall = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedLocation && selectedServiceProvider) {
      console.log('Opening call:', {
        message: callMessage || null,  // Make message optional
        location: selectedLocation,
        serviceProvider: selectedServiceProvider,
        categories: {
          identifiedInjured,
          injuryTypes: identifiedInjured ? injuryTypes : [],
          needEvacuation,
          evacuationType: needEvacuation ? evacuationType : null,
          dangerousLocation,
          dangerousLocationTypes: dangerousLocation ? dangerousLocationTypes : [],
          clearPath
        }
      })
      alert('הקריאה נשלחה בהצלחה')
      setCallMessage('')
      setSelectedLocation(null)
      setSelectedServiceProvider('')
      setIdentifiedInjured(false)
      setInjuryTypes([])
      setNeedEvacuation(false)
      setEvacuationType('')
      setDangerousLocation(false)
      setDangerousLocationTypes([])
      setClearPath(false)
    } else {
      alert('נא למלא את כל השדות החובה')
    }
  }

  return (
    <Card className="w-full max-w-sm min-h-[600px] relative">
      <CardHeader className="text-center">
        <div className="mx-auto w-20 h-20 mb-4 bg-gray-200 rounded-full flex items-center justify-center">
          LOGO
        </div>
      </CardHeader>
      <CardContent>
        {view !== 'login' && (
          <div className="absolute top-4 right-4 z-10">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-0">
                  ...
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[300px] p-0 bg-background z-[100]">
                <div className="flex flex-col p-4 space-y-2">
                  {menuItems.map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      className="w-full text-right justify-start text-lg py-4"
                      onClick={() => {
                        if (item.action) {
                          item.action();
                        } else if (item.view) {
                          setView(item.view);
                          toggleDialog(false);
                        }
                      }}
                    >
                      {item.title}
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
        {view !== 'login' && (
          <div className="mb-4 text-xl font-semibold text-right">
            שלום {loggedInUser}
          </div>
        )}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="שם משתמש"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-right"
            />
            <Input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-right"
            />
            <Button type="submit" className="w-full">
              התחבר
            </Button>
          </form>
        )}
        {view === 'forgotPassword' && (
          <form onSubmit={handleSendNewPassword} className="space-y-4">
            <Input
              type="text"
              placeholder="שם משתמש"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-right"
            />
            <Input
              type="text"
              placeholder="ת.ז / מספר אישי"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="text-right"
            />
            <Button type="submit" className="w-full">
              שלח סיסמה חדשה
            </Button>
          </form>
        )}
        {view === 'home' && (
          <div className="space-y-2">
            {isMapVisible && renderMap()}
          </div>
        )}
        {view === 'messages' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="חיפוש אנשי קשר"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow text-right"
              />
            </div>
            <div className="flex justify-end items-center space-x-2">
              <ToggleGroup 
                type="single" 
                value={filterUnread ? "unread" : "all"}
                onValueChange={(value) => setFilterUnread(value === "unread")}
              >
                <ToggleGroupItem value="all" aria-label="Toggle all messages">
                  הכל
                </ToggleGroupItem>
                <ToggleGroupItem value="unread" aria-label="Toggle unread messages">
                  לא נקרא
                </ToggleGroupItem>
              </ToggleGroup>
              <Filter className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-2">
              {filteredMessages.map(message => renderMessage(message))}
            </div>
            <Button
              onClick={handleBackToHome}
              className="w-full mt-4 flex items-center justify-center"
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              חזרה לדף הבית
            </Button>
          </div>
        )}
        {view === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="חיפוש משימות"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow text-right"
              />
            </div>
            <div className="flex justify-end items-center space-x-2">
              <ToggleGroup 
                type="single" 
                value={filterCategory}
                onValueChange={(value) => setFilterCategory(value as TaskCategory | 'all')}
              >
                <ToggleGroupItem value="all" aria-label="Toggle all tasks">
                  הכל
                </ToggleGroupItem>
                <ToggleGroupItem value="new" aria-label="Toggle new tasks">
                  חדש
                </ToggleGroupItem>
                <ToggleGroupItem value="inProgress" aria-label="Toggle in-progress tasks">
                  בביצוע
                </ToggleGroupItem>
                <ToggleGroupItem value="closed" aria-label="Toggle closed tasks">
                  סגור
                </ToggleGroupItem>
              </ToggleGroup>
              <Filter className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {renderTasksByCategory()}
            </div>
            <Button
              onClick={handleBackToHome}
              className="w-full mt-4 flex items-center justify-center"
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              חזרה לדף הבית
            </Button>
          </div>
        )}
        {view === 'maps' && (
          <div className="space-y-4">
            <div className="flex justify-end space-x-2 mb-2">
              <ToggleGroup type="single" value={mapType} onValueChange={(value) => setMapType(value as 'street' | 'topographic')}>
                <ToggleGroupItem value="street" aria-label="Toggle street map">
                  מפת רחובות
                </ToggleGroupItem>
                <ToggleGroupItem value="topographic" aria-label="Toggle topographic map">
                  מפה טופוגרפית
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-2 mb-2">
              <Input
                type="text"
                placeholder="נקודת התחלה"
                value={routeStart}
                onChange={(e) => setRouteStart(e.target.value)}
                className="text-right"
              />
              <Input
                type="text"
                placeholder="נקודת סיום"
                value={routeEnd}
                onChange={(e) => setRouteEnd(e.target.value)}
                className="text-right"
              />
              <div className="flex space-x-2">
                <Button onClick={handleRouteSearch} className="flex-1">
                  חפש מסלול
                </Button>
                <Button onClick={handleClearRoute} variant="outline" className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  נקה מסלול
                </Button>
              </div>
            </div>
            {renderMap()}
            <Button
              onClick={handleBackToHome}
              className="w-full mt-4 flex items-center justify-center"
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              חזרה לדף הבית
            </Button>
          </div>
        )}
        {view === 'openCall' && (
          <form onSubmit={handleOpenCall} className="space-y-4">
            <h2 className="text-xl font-semibold text-right">פתיחת קריאה</h2>
            <div className="h-48 mb-4">
              {renderMap()}
            </div>
            <p className="text-sm text-right mb-4">לחץ על המפה לבחירת מיקום</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-end space-x-2">
                <Select 
                  value={injuryTypes.length > 0 ? injuryTypes[0] : ''} 
                  onValueChange={(value) => setInjuryTypes([value])}
                  disabled={!identifiedInjured}
                >
                  <SelectTrigger className="w-full max-w-[200px]">
                    <SelectValue placeholder="סוג פגיעה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multi">אירוע רב נפגעים</SelectItem>
                    <SelectItem value="severe">פצוע קשה</SelectItem>
                    <SelectItem value="moderate">פצוע בינוני</SelectItem>
                    <SelectItem value="mild">פצוע קל</SelectItem>
                  </SelectContent>
                </Select>
                <span>זיהוי פצוע</span>
                <Checkbox 
                  checked={identifiedInjured} 
                  onCheckedChange={(checked) => {
                    setIdentifiedInjured(checked as boolean)
                    if (!checked) setInjuryTypes([])
                  }} 
                />
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Select 
                  value={dangerousLocationTypes.length > 0 ? dangerousLocationTypes[0] : ''} 
                  onValueChange={(value) => setDangerousLocationTypes([value])}
                  disabled={!dangerousLocation}
                >
                  <SelectTrigger className="w-full max-w-[200px]">
                    <SelectValue placeholder="סוג סכנה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flood">שיטפון</SelectItem>
                    <SelectItem value="fire">שריפה</SelectItem>
                    <SelectItem value="electric">חוטי חשמל קרועים</SelectItem>
                  </SelectContent>
                </Select>
                <span>מיקום מסוכן</span>
                <Checkbox 
                  checked={dangerousLocation} 
                  onCheckedChange={(checked) => {
                    setDangerousLocation(checked as boolean)
                    if (!checked) setDangerousLocationTypes([])
                  }} 
                />
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Select value={evacuationType} onValueChange={setEvacuationType} disabled={!needEvacuation}>
                  <SelectTrigger className="w-full max-w-[200px]">
                    <SelectValue placeholder="סוג פינוי" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="air">פינוי מוסק</SelectItem>
                    <SelectItem value="ground">פינוי רגלי</SelectItem>
                    <SelectItem value="ambulance">פינוי באמבולנס</SelectItem>
                  </SelectContent>
                </Select>
                <span>צורך בפינוי</span>
                <Checkbox 
                  checked={needEvacuation} 
                  onCheckedChange={(checked) => {
                    setNeedEvacuation(checked as boolean)
                    if (!checked) setEvacuationType('')
                  }} 
                />
              </div>
              <label className="flex items-center justify-end space-x-2">
                <span>דרך פנויה</span>
                <Checkbox checked={clearPath} onCheckedChange={(checked) => {setClearPath}} />
              </label>
            </div>
            <Textarea
              placeholder="תוכן ההודעה"
              value={callMessage}
              onChange={(e) => setCallMessage(e.target.value)}
              className="text-right mb-4"
            />
            <Select value={selectedServiceProvider} onValueChange={setSelectedServiceProvider}>
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder="בחר נותן שירות" />
              </SelectTrigger>
              <SelectContent>
                {serviceProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.name}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full mt-4">
              <Send className="w-4 h-4 mr-2submit" />
              <Send className="w-4 h-4 mr-2" />
              שלח קריאה
            </Button>
          </form>
        )}
      </CardContent>
      {view === 'login' && (
        <CardFooter className="flex justify-between">
          <Button variant="link" onClick={handleSwitchUser} className="text-sm">
            החלף משתמש
          </Button>
          <Button variant="link" onClick={handleForgotPassword} className="text-sm">
            שכחתי סיסמה
          </Button>
        </CardFooter>
      )}
      <style jsx global>{`
        .leaflet-container {
          font: inherit;
        }
      `}</style>
    </Card>
  )
}

