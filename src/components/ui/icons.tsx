// Centralized icon system, ported from MboaTrust's icons.tsx — one library
// (Lucide), one stroke weight, sizes chosen per context. Trimmed to the
// names MorphoFit's shell/nav/pages actually use.
import type { CSSProperties } from 'react'
import {
  AlertTriangle, BarChart3, Bell, Box, Briefcase, Calendar, Camera, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleDot, Clock, Compass, CreditCard, DollarSign, Eye, EyeOff, FileText, Handshake, HelpCircle, Home, Image, Info, Layers, LayoutGrid, LifeBuoy, LogOut, Mail, MapPin, Mic, MessageCircle, Moon,
  Navigation, Package, Palette, Pause, Phone, PhoneOff, Play, Receipt, RefreshCw, Ruler, Scissors, Search, Send, Settings, Shield, ShieldCheck, Sliders, Sparkles,
  Star, Store, Sun, Tag, Trash2, Truck, Upload, User, UserPlus, Users, X,
  type LucideIcon,
} from 'lucide-react'

export const ICONS = {
  home: Home,
  grid: LayoutGrid,
  users: Users,
  user: User,
  calendar: Calendar,
  clock: Clock,
  receipt: Receipt,
  briefcase: Briefcase,
  store: Store,
  truck: Truck,
  package: Package,
  ruler: Ruler,
  scissors: Scissors,
  shieldCheck: ShieldCheck,
  shield: Shield,
  settings: Settings,
  search: Search,
  bell: Bell,
  mail: Mail,
  message: MessageCircle,
  camera: Camera,
  image: Image,
  sparkles: Sparkles,
  layers: Layers,
  handshake: Handshake,
  check: Check,
  checkCircle: CheckCircle2,
  alert: AlertTriangle,
  info: Info,
  dot: CircleDot,
  close: X,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  logOut: LogOut,
  sun: Sun,
  moon: Moon,
  mic: Mic,
  play: Play,
  pause: Pause,
  send: Send,
  phone: Phone,
  phoneOff: PhoneOff,
  trash: Trash2,
  compass: Compass,
  creditCard: CreditCard,
  dollarSign: DollarSign,
  barChart: BarChart3,
  sliders: Sliders,
  mapPin: MapPin,
  box: Box,
  tag: Tag,
  palette: Palette,
  eye: Eye,
  eyeOff: EyeOff,
  navigation: Navigation,
  refresh: RefreshCw,
  upload: Upload,
  star: Star,
  fileText: FileText,
  lifeBuoy: LifeBuoy,
  helpCircle: HelpCircle,
  userPlus: UserPlus,
} as const

export type IconName = keyof typeof ICONS

export function AppIcon({ name, size = 16, strokeWidth = 1.75, className, style }: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}) {
  const Icon: LucideIcon = ICONS[name]
  return <Icon size={size} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true" />
}
