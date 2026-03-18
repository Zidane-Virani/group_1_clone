export type AuctionStatus = 'draft' | 'active' | 'closed' | 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type ItemStatus = 'draft' | 'active' | 'sold' | 'DRAFT' | 'ACTIVE' | 'SOLD';

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'REP' | 'SUPER_ADMIN';
  kogbucks_balance: number;
  created_at: string;
};

export type RepProfile = {
  id: string;
  user_id: string;
  company_name: string;
  bio: string;
  created_at: string;
};

export type Auction = {
  id: string;

  // main uses title; some older code might say "name" in DB results
  title: string;
  description?: string;

  start_time: string;
  end_time: string;

  status: AuctionStatus;

  created_by: string | null;
  created_at: string;

  // harmless if DB doesn't have it
  updated_at?: string;
};

export type Item = {
  id: string;
  auction_id: string;

  // main uses name; some older code might use title
  name: string;
  title?: string;

  description: string;

  // main bidding fields
  starting_bid: number;
  current_bid: number;

  /** Id of the user who is currently the highest bidder (SCRUM-17 lock). */
  current_bidder_id?: string | null;

  // support either approach to images
  image_url?: string;

  
  category?: string | null;
  retail_value?: number | null;

  // optional because some schemas include it, some don't
  status?: ItemStatus;

  created_at: string;
  updated_at?: string;
};

export type Bid = {
  id: string;
  item_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
};

export type AuctionOutcome = {
  id: string;
  auction_id: string;
  item_id: string;
  winning_bid_id?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  created_at: string;
};

export type ItemImage = {
  id: string;
  item_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
};

export type ItemWithImage = Item & {
  image?: ItemImage | null;
};