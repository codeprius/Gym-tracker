-- Run this in your Supabase SQL editor

-- Categories table (per user, custom)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#f97316',
  created_at timestamptz default now()
);

-- Exercises table (per user)
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  created_at timestamptz default now()
);

-- Workouts table (one per day per user)
create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Workout exercises (exercises logged in a workout)
create table if not exists workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id) on delete cascade not null,
  exercise_name text not null,
  category_id uuid references categories(id) on delete set null,
  notes text,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Sets table
create table if not exists sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid references workout_exercises(id) on delete cascade not null,
  set_number integer not null,
  reps integer,
  weight_kg numeric(6,2),
  created_at timestamptz default now()
);

-- Enable RLS
alter table categories enable row level security;
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table sets enable row level security;

-- RLS Policies
create policy "Users manage own categories" on categories for all using (auth.uid() = user_id);
create policy "Users manage own exercises" on exercises for all using (auth.uid() = user_id);
create policy "Users manage own workouts" on workouts for all using (auth.uid() = user_id);
create policy "Users manage own workout_exercises" on workout_exercises
  for all using (
    workout_id in (select id from workouts where user_id = auth.uid())
  );
create policy "Users manage own sets" on sets
  for all using (
    workout_exercise_id in (
      select we.id from workout_exercises we
      join workouts w on w.id = we.workout_id
      where w.user_id = auth.uid()
    )
  );
