export type TransactionItem = {
  id: string
  name: string
  avatar: string
  verified: boolean
  time: string
  change: number
  amount: string
}

export const mockTransactionData: TransactionItem[] = [
  {
    id: '1',
    name: 'joshuakelly',
    avatar: 'https://i.pravatar.cc/150?img=1',
    verified: true,
    time: '2h ago',
    change: 12.5,
    amount: '34.56',
  },
  {
    id: '2',
    name: 'mikeyspark',
    avatar: 'https://i.pravatar.cc/150?img=2',
    verified: false,
    time: '4h ago',
    change: -3.2,
    amount: '92.11',
  },
  {
    id: '3',
    name: 'emmablossom',
    avatar: 'https://i.pravatar.cc/150?img=3',
    verified: true,
    time: '6h ago',
    change: 8.7,
    amount: '456.78',
  },
  {
    id: '4',
    name: 'alexrodriguez',
    avatar: 'https://i.pravatar.cc/150?img=4',
    verified: false,
    time: '1d ago',
    change: -1.5,
    amount: '67.89',
  },
  {
    id: '5',
    name: 'jessicalee',
    avatar: 'https://i.pravatar.cc/150?img=5',
    verified: true,
    time: '2d ago',
    change: 15.3,
    amount: '789',
  },
  {
    id: '6',
    name: 'davidpark',
    avatar: 'https://i.pravatar.cc/150?img=6',
    verified: false,
    time: '3d ago',
    change: 4.2,
    amount: '012.34',
  },
]
