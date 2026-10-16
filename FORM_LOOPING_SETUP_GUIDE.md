# Form Looping - Setup & Testing Guide

## ✅ What's Been Implemented (Phase 1 MVP)

The core form looping feature is now ready! Here's what's complete:

### 1. **Database Schema** ✅
- SQL migration file created: `supabase/add_loop_section_support.sql`
- Adds 5 new columns to `form_steps` table for loop configuration
- Adds `iteration_number` column to `response_answers` for tracking iterations
- Creates index for efficient querying

### 2. **Form Builder UI** ✅
- New question type: **Loop Section** with repeat icon
- Complete configuration interface:
  - Item label (e.g., "Window", "Property")
  - Loop start step selector (which step to loop back to)
  - Loop end step selector (which step marks the end of loop)
  - Max iterations (1-50, default 10)
  - Custom button text for "Add Another" button
  - Visual preview showing loop range and settings

### 3. **Form Embed (User-Facing)** ✅
- Beautiful gradient UI for loop section step
- Two action buttons:
  - **"Add Another [Label]"** - loops back to start with iteration counter
  - **"Continue"** - proceeds to next step after loop
- Real-time iteration counter display
- Max iteration enforcement
- State management for loop tracking

### 4. **Response Tracking** ✅
- Iteration numbers saved with each answer
- Support for multiple iterations of same questions
- Loop history tracking

### 5. **Preview Mode** ✅
- SingleStepPreview component updated with loop_section rendering
- Shows how loop section will appear to users

---

## 🚀 Next Steps - Complete Setup

### Step 1: Run Database Migration

Open your Supabase SQL Editor and run this file:

```
supabase/add_loop_section_support.sql
```

**How to run:**
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy/paste the contents of `supabase/add_loop_section_support.sql`
5. Click **Run**

**What it does:**
- Adds loop configuration columns to form_steps
- Adds iteration_number to response_answers
- Creates performance index
- Adds helpful documentation comments

---

## 📝 How to Use Form Looping

### Creating a Loop in Form Builder

1. **Add questions you want to loop** (e.g., multiple choice, text input, image selection)
   - Example: Steps 3-5 could be "Window Type", "Window Size", "Window Location"

2. **Add a Loop Section step** (after the questions you want to repeat)
   - Choose **Loop Section** from question types
   - Configure:
     - **Item Label**: "Window" (or whatever you're collecting multiple of)
     - **Loop Start Step**: Select the first step to repeat (e.g., "Window Type")
     - **Loop End Step**: Select the last step to repeat (e.g., "Window Location")
     - **Max Iterations**: How many times user can loop (default 10)
     - **Button Text**: Customize "Add Another" button (optional)

3. **Save and publish**

### User Experience

When a user fills out your form:

1. They answer questions in the loop (e.g., Window Type → Size → Location)
2. They reach the Loop Section step
3. They see a beautiful UI with two options:
   - **"Add Another Window"** - goes back to first question with iteration counter
   - **"Continue"** - moves past the loop
4. Each iteration is tracked separately in the database
5. They can add up to the max iterations you set

---

## 🎨 Example Use Cases

### 1. **Property Survey with Multiple Windows**
```
Step 1: Property Address
Step 2: Number of Rooms
↓ LOOP START ↓
Step 3: Window Type (dropdown)
Step 4: Window Measurements (dimensions)
Step 5: Window Condition (image selection)
↓ LOOP END ↓
Step 6: Loop Section (label: "Window")
Step 7: Additional Comments
```

### 2. **Product Order with Multiple Items**
```
Step 1: Customer Details
↓ LOOP START ↓
Step 2: Product Selection
Step 3: Quantity
Step 4: Customization Options
↓ LOOP END ↓
Step 5: Loop Section (label: "Product")
Step 6: Delivery Details
```

### 3. **Event Registration with Multiple Attendees**
```
Step 1: Event Selection
↓ LOOP START ↓
Step 2: Attendee Name
Step 3: Dietary Restrictions
Step 4: T-Shirt Size
↓ LOOP END ↓
Step 5: Loop Section (label: "Attendee")
Step 6: Payment Information
```

---

## 🧪 Testing Checklist

- [ ] **Database Migration**
  - Run SQL migration in Supabase
  - Verify columns exist: `SELECT * FROM form_steps LIMIT 1;`
  - Verify iteration column: `SELECT * FROM response_answers LIMIT 1;`

- [ ] **Form Builder**
  - Create new form
  - Add Loop Section step type
  - Configure loop with start/end steps
  - Preview step to see loop UI
  - Save form successfully

- [ ] **Form Embed (User Filling)**
  - Open form in browser
  - Complete first iteration of loop
  - Click "Add Another" - verify it loops back
  - Complete second iteration
  - Click "Continue" - verify it proceeds forward
  - Submit form

- [ ] **Response Data**
  - View form responses in Responses page
  - Verify iteration_number is saved (0 for non-loop, 1+ for loops)
  - Check that multiple iterations are distinct

- [ ] **Edge Cases**
  - Try reaching max iterations limit
  - Verify "Add Another" button disappears/disables
  - Test with different loop ranges
  - Test with conditional logic in loop sections

---

## 📊 Database Structure

### form_steps Table (New Columns)
```sql
loop_start_step_id    UUID         -- References form_steps(id)
loop_end_step_id      UUID         -- References form_steps(id)
loop_label            TEXT         -- e.g., "Window", "Product"
loop_max_iterations   INTEGER      -- Default: 10
loop_button_text      TEXT         -- Custom button text
```

### response_answers Table (New Column)
```sql
iteration_number      INTEGER      -- 0 = not in loop, 1+ = iteration #
```

---

## 🎯 What's Next (Future Enhancements)

### Phase 2: Polish & UX
- [ ] Summary preview before submitting (show all iterations)
- [ ] Edit previous iterations
- [ ] Delete an iteration
- [ ] Copy from previous iteration
- [ ] Progress indicator (e.g., "3 of 5 windows added")

### Phase 3: Advanced Features
- [ ] Dynamic loop labels based on user input (e.g., "Add Bedroom 2 Window")
- [ ] Nested loops (loop within a loop)
- [ ] Conditional loop visibility
- [ ] Loop templates/presets
- [ ] Bulk import of loop data

---

## 🐛 Known Limitations (Phase 1)

1. **No Edit Previous Iterations**: Once user clicks "Add Another", they can't go back to edit previous iterations
2. **No Summary View**: No way to see all iterations at once before submitting
3. **No Dynamic Labels**: Loop label is static (can't be "Window 1", "Window 2" with auto-numbering)
4. **No Delete Iteration**: Can't remove a completed iteration

These will be addressed in Phase 2.

---

## 🎉 Ready to Test!

The core functionality is complete. Once you run the database migration, you can:

1. Create a form with loop sections
2. Test the user experience
3. View responses with iteration tracking

**Next immediate steps:**
1. Run the SQL migration
2. Create a test form with a loop
3. Fill it out and verify iteration tracking
4. Check responses page for grouped data

Let me know if you encounter any issues or have questions!
