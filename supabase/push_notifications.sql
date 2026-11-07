create extension if not exists pg_net with schema extensions;

create or replace function public.push_send(
  p_profile_id text,
  p_title text,
  p_body text,
  p_data jsonb
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
begin
  if p_profile_id is null or p_profile_id = '' then
    return;
  end if;

  select expo_push_token into v_token
  from public.profiles
  where id::text = p_profile_id;

  if v_token is null or v_token not like 'ExponentPushToken%' then
    return;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := jsonb_build_object(
      'to', v_token,
      'title', left(coalesce(nullif(p_title, ''), 'ERecycloMatch'), 100),
      'body', left(coalesce(p_body, ''), 180),
      'sound', 'default',
      'channelId', 'default',
      'priority', 'high',
      'data', coalesce(p_data, '{}'::jsonb)
    ),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
exception when others then
  raise warning 'push_send failed: %', sqlerrm;
end;
$$;

-- Only the triggers below may call push_send, not the app
revoke all on function public.push_send(text, text, text, jsonb) from public, anon, authenticated;

-- Chat messages
create or replace function public.push_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receiver text;
  v_title text;
  v_body text;
  v_conv record;
begin
  v_receiver := new.receiver_id::text;


  if v_receiver is null and new.sender_id is not null then
    select user_id::text as user_id, facility_id::text as facility_id
      into v_conv
    from public.conversations
    where id::text = new.conversation_id::text;

    if found then
      v_receiver := case
        when v_conv.user_id = new.sender_id::text then v_conv.facility_id
        else v_conv.user_id
      end;
    end if;
  end if;

 
  if v_receiver is null or v_receiver = coalesce(new.sender_id::text, '') then
    return new;
  end if;

  v_title := 'ERecycloMatch';

  if coalesce(new.message_type, '') = 'match_request' then
    -- A match request, not a chat message
    v_body := coalesce(nullif(nullif(new.sender_name, ''), 'System'), 'Someone')
      || ' sent a match request'
      || coalesce(' for ' || nullif(new.item_name, ''), '');
  elsif new.sender_id is null then
    -- System notice (e.g. "Match request sent")
    v_body := coalesce(nullif(new.message, ''), 'You have a new update');
  else
    -- Chat message: show who messaged, never the message itself (privacy)
    v_body := coalesce(nullif(nullif(new.sender_name, ''), 'System'), 'Someone')
      || ' messaged you';
  end if;

  perform public.push_send(
    v_receiver,
    v_title,
    v_body,
    jsonb_build_object('type', 'message', 'conversation_id', new.conversation_id)
  );

  return new;
exception when others then
  raise warning 'push_on_message failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists push_on_message on public.messages;
create trigger push_on_message
  after insert on public.messages
  for each row execute function public.push_on_message();

-- Notifications (nearby listing, match accepted/declined, ...)
create or replace function public.push_on_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Chat notifications duplicate a `messages` row, which already sent a push
  if coalesce(new.type, '') in ('new_message', 'message') then
    return new;
  end if;

  perform public.push_send(
    new.profile_id::text,
    new.title,
    new.message,
    jsonb_build_object('type', coalesce(new.type, 'system'), 'notification_id', new.id)
  );

  return new;
exception when others then
  raise warning 'push_on_notification failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists push_on_notification on public.notifications;
create trigger push_on_notification
  after insert on public.notifications
  for each row execute function public.push_on_notification();
