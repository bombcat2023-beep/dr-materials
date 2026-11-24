
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { MaterialStat } from '@/types/market';
import { MessageCircle, Loader2, ArrowLeft, Send, RefreshCw, Trash2 } from 'lucide-react';

type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string | null;
  listing_type: 'material' | 'character' | 'platinum' | 'general';
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
  created_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type MessagesTabProps = {
  userId: string;
  openConversationId?: string | null;
  stats: MaterialStat[];
};

export function MessagesTab({ userId, openConversationId, stats }: MessagesTabProps) {
  const supabase = useMemo(() => createClient(), []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [emptyConversationIds, setEmptyConversationIds] = useState<string[]>([]);
  const [unreadConversationIds, setUnreadConversationIds] = useState<string[]>([]);
  const [listingMaterialIds, setListingMaterialIds] = useState<Record<string, number>>({});
  const [messageText, setMessageText] = useState('');

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the signed-in user's conversations
  const loadConversations = async () => {
    setError(null);
	
    const { data, error } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id, listing_id, listing_type, buyer_last_read_at, seller_last_read_at, created_at')
      .or(
        `and(buyer_id.eq.${userId},buyer_deleted_at.is.null),and(seller_id.eq.${userId},seller_deleted_at.is.null)`
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      setError('Unable to load your conversations.');
      return;
    }

    const loadedConversations = data || [];
	
    // Find which conversations already contain messages
    const conversationIds = loadedConversations.map(
      (conversation) => conversation.id
    );

    if (conversationIds.length > 0) {
      const { data: existingMessages, error: messageLookupError } = await supabase
        .from('messages')
        .select('conversation_id, sender_id, created_at')
        .in('conversation_id', conversationIds);

      if (messageLookupError) {
        console.error('Error checking conversation messages:', messageLookupError);
        setEmptyConversationIds([]);
        setUnreadConversationIds([]);
      } else {
        const messagesByConversation = new Map<
          string,
          { hasMessages: boolean; latestIncoming: string | null }
        >();

        (existingMessages || []).forEach((message) => {
          const current = messagesByConversation.get(message.conversation_id) || {
            hasMessages: false,
            latestIncoming: null,
          };

          current.hasMessages = true;

          if (message.sender_id !== userId) {
            if (
              !current.latestIncoming ||
              new Date(message.created_at) > new Date(current.latestIncoming)
            ) {
              current.latestIncoming = message.created_at;
            }
          }

          messagesByConversation.set(message.conversation_id, current);
        });

        setEmptyConversationIds(
          conversationIds.filter(
            (id) => !messagesByConversation.get(id)?.hasMessages
          )
        );

        const unreadIds = loadedConversations
          .filter((conversation) => {
            const latestIncoming = messagesByConversation.get(
              conversation.id
            )?.latestIncoming;

            if (!latestIncoming) return false;

            const lastReadAt =
              conversation.buyer_id === userId
                ? conversation.buyer_last_read_at
                : conversation.seller_last_read_at;

            return (
              !lastReadAt ||
              new Date(latestIncoming) > new Date(lastReadAt)
            );
          })
          .map((conversation) => conversation.id);

        setUnreadConversationIds(unreadIds);
      }
    } else {
      setEmptyConversationIds([]);
      setUnreadConversationIds([]);
    }

    // Find the material listing IDs associated with these conversations
    const materialListingIds = loadedConversations
      .filter(
        (conversation) =>
          conversation.listing_type === 'material' && conversation.listing_id
      )
      .map((conversation) => conversation.listing_id as string);

    if (materialListingIds.length > 0) {
      const { data: materialListings, error: listingError } = await supabase
        .from('material_listings')
        .select('id, material_id')
        .in('id', materialListingIds);

      if (listingError) {
        console.error('Error loading conversation listing details:', listingError);
      } else {
        const lookup: Record<string, number> = {};

        (materialListings || []).forEach((listing) => {
          lookup[listing.id] = listing.material_id;
        });

        setListingMaterialIds(lookup);
      }
    } else {
      setListingMaterialIds({});
    }

    setConversations(loadedConversations);
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoadingConversations(true);
      await loadConversations();
      setLoadingConversations(false);
    };

    initialLoad();
  }, [supabase, userId]);
  
   // Open a requested conversation directly, independently of inbox loading
  useEffect(() => {
    if (!openConversationId) return;

    let cancelled = false;

    const loadRequestedConversation = async () => {
      setError(null);

      const { data, error } = await supabase
        .from('conversations')
        .select(
          'id, buyer_id, seller_id, listing_id, listing_type, buyer_last_read_at, seller_last_read_at, created_at'
        )
        .eq('id', openConversationId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Error opening requested conversation:', error);
        setError('Unable to open this conversation. Please try again.');
        return;
      }

      if (!data) {
        setError('This conversation could not be found or is no longer accessible.');
        return;
      }

      setConversations((current) => {
        if (current.some((item) => item.id === data.id)) {
          return current;
        }

        return [data, ...current];
      });

      setMessageText('');
      setSelectedConversation(data);

      setUnreadConversationIds((current) =>
        current.filter((id) => id !== data.id)
      );
    };

    loadRequestedConversation();

    return () => {
      cancelled = true;
    };
  }, [openConversationId, supabase]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setLoadingMessages(true);
      setError(null);

      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, body, created_at')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Error loading messages:', error);
        setError('Unable to load messages for this conversation.');
        setMessages([]);
      } else {
        setMessages(data || []);

        const { error: readError } = await supabase.rpc(
          'mark_conversation_read',
          {
            p_conversation_id: selectedConversation.id,
          }
        );

        if (readError) {
          console.error('Error marking conversation as read:', readError);
        }
      }

      setLoadingMessages(false);
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedConversation, supabase]);

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.buyer_id === userId
      ? conversation.seller_id
      : conversation.buyer_id;
  };

  const getListingLabel = (conversation: Conversation) => {
    if (conversation.listing_type === 'material' && conversation.listing_id) {
      const materialId = listingMaterialIds[conversation.listing_id];
      const material = stats.find((item) => item.material_id === materialId);

      return material?.name || 'Material Listing';
    }

    switch (conversation.listing_type) {
      case 'character':
        return 'Character Listing';
      case 'platinum':
        return 'Platinum Listing';
      default:
        return 'General Conversation';
    }
  };

  const openConversation = (conversation: Conversation) => {
    setError(null);
    setMessageText('');
    setSelectedConversation(conversation);

    // Remove the unread indicator immediately
    setUnreadConversationIds((current) =>
      current.filter((id) => id !== conversation.id)
    );
  };

  const deleteConversation = async (conversation: Conversation) => {
    const confirmed = window.confirm(
      'Remove this conversation from your inbox? The other participant will still have access to it.'
    );

    if (!confirmed) return;

    const { error } = await supabase.rpc('delete_conversation_for_me', {
      p_conversation_id: conversation.id,
    });

    if (error) {
      console.error('Error deleting conversation:', error);
      setError('Unable to remove this conversation. Please try again.');
      return;
    }

    setConversations((current) =>
      current.filter((item) => item.id !== conversation.id)
    );

    setEmptyConversationIds((current) =>
      current.filter((id) => id !== conversation.id)
    );

    if (selectedConversation?.id === conversation.id) {
      setSelectedConversation(null);
      setMessages([]);
    }
  };

  const refreshMessages = async () => {
    if (!selectedConversation || loadingMessages) return;

    setLoadingMessages(true);
    setError(null);

    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .eq('conversation_id', selectedConversation.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error refreshing messages:', error);
      setError('Unable to refresh messages. Please try again.');
    } else {
      setMessages(data || []);
    }

    setLoadingMessages(false);
  };


  // Listen for new messages in realtime
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          // Ignore our own messages (sendMessage already handles those)
          if (newMessage.sender_id === userId) return;

          // If this conversation is currently open, refresh its messages
          if (selectedConversation?.id === newMessage.conversation_id) {
            const { data, error } = await supabase
              .from('messages')
              .select('id, conversation_id, sender_id, body, created_at')
              .eq('conversation_id', selectedConversation.id)
              .order('created_at', { ascending: true });

            if (!error && data) {
              setMessages(data);

              // Keep the open conversation marked as read
              const { error: readError } = await supabase.rpc(
                'mark_conversation_read',
                {
                  p_conversation_id: selectedConversation.id,
                }
              );

              if (readError) {
                console.error('Error marking conversation as read:', readError);
              }
            }
          }

          // Refresh inbox and unread indicators after marking read
          await loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, selectedConversation]);


  const deleteMessage = async (message: Message) => {
    if (message.sender_id !== userId) return;

    const confirmed = window.confirm(
      'Delete this message for both participants? This cannot be undone.'
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', message.id)
      .eq('sender_id', userId);

    if (error) {
      console.error('Error deleting message:', error);
      setError('Unable to delete this message. Please try again.');
      return;
    }

    setMessages((current) =>
      current.filter((item) => item.id !== message.id)
    );
  };


  const sendMessage = async () => {
    const body = messageText.trim();

    if (!body || !selectedConversation || sending) return;

    setSending(true);
    setError(null);

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: userId,
        body,
      });

    if (error) {
      console.error('Error sending message:', error);
      setError('Message failed to send. Please try again.');
      setSending(false);
      return;
    }

    setMessageText('');

    const { data, error: reloadError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .eq('conversation_id', selectedConversation.id)
      .order('created_at', { ascending: true });

    if (!reloadError && data) {
      setMessages(data);
    }

    await loadConversations();
    setSending(false);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="w-6 h-6 text-amber-400" />
        <h2 className="text-xl font-bold text-amber-400">Messages</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[500px] flex">
        {/* Conversation list */}
        <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-80 shrink-0 border-r border-slate-800`}>
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h3 className="font-semibold text-slate-200">Inbox</h3>

            <button
              type="button"
              onClick={() => {
                if (selectedConversation) {
                  refreshMessages();
                } else {
                  loadConversations();
                }
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
              title="Refresh inbox"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingConversations ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading inbox...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <MessageCircle className="w-9 h-9 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No messages yet</p>
              <p className="text-xs mt-1">
                Contact a seller to start a conversation.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-2 p-4 hover:bg-slate-800/50 transition ${
                    selectedConversation?.id === conversation.id ? 'bg-slate-800/70' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openConversation(conversation)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-200 break-all">
                        {getOtherParticipant(conversation)}
                      </p>

                      {unreadConversationIds.includes(conversation.id) && (
                        <span
                          title="Unread messages"
                          aria-label="Unread messages"
                          className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                        />
                      )}
                    </div>

                    <p className="text-xs text-amber-400 mt-1">
                      {getListingLabel(conversation)}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {formatTime(conversation.created_at)}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteConversation(conversation)}
                    title="Remove conversation from my inbox"
                    className="shrink-0 p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation window */}
        <div className={`${selectedConversation ? 'block' : 'hidden md:flex'} flex-1 min-w-0 flex flex-col`}>
          {!selectedConversation ? (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-500">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p>Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
                  title="Back to inbox"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 break-all">
                    {getOtherParticipant(selectedConversation)}
                  </p>
                  <p className="text-xs text-amber-400">
                    {getListingLabel(selectedConversation)}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[350px] max-h-[550px]">
                {loadingMessages ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    <p>No messages in this conversation yet.</p>
                    <p className="text-sm mt-1">Send the first message below!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender_id === userId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                            isMine
                              ? 'bg-amber-500 text-slate-950 rounded-br-sm'
                              : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                          <div className="flex items-center justify-between gap-4 mt-1">
                            <p className={`text-[10px] ${isMine ? 'text-slate-800/70' : 'text-slate-500'}`}>
                              {formatTime(message.created_at)}
                            </p>

                            {isMine && (
                              <button
                                type="button"
                                onClick={() => deleteMessage(message)}
                                title="Delete message for both participants"
                                className="text-slate-800/60 hover:text-red-700 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t border-slate-800">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Write a message... (Enter to send, Shift+Enter for new line)"
                    maxLength={5000}
                    rows={2}
                    disabled={sending}
                    className="flex-1 resize-none bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={sending || !messageText.trim()}
                    className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-semibold px-4 py-2 rounded-lg transition"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 text-right">
                  {messageText.length}/5000
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
