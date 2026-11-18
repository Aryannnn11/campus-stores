# Campus Stores — a shift-ready equipment desk

A lightweight, offline **Product Engineer work sample** based on the [Campus Stores exercise](https://github.com/virinchi-healthcare/campus-stores). The prototype keeps the familiar request, inventory, loan-register, and desk-book flows while making a multi-item return and the next-day handover easier to manage.

## Product decision

**Keep:** A separate loan slip for every physical item. During the Friday pickup, the desk can issue `PR-04` (projector), `SP-02` (speaker), and `AD-12` (adapter) against approved request `RQ-214`. A concrete tag per slip is much safer than a generic “one projector” checkout, and inventory updates immediately when a unit goes on loan. This is the existing product's strongest idea.

**Change:** The original partial-return flow distributes the important facts across several screens: you can mark individual slips returned, but Kabir's message that Leela still has the adapter lives in the desk book, unlinked to a specific asset. On Saturday the new desk worker must mentally join the request, outstanding slips, inventory, and free-text note to know which adapter to close. If `AD-15` is returned instead of `AD-12`, the original “Record return” action could be used against the wrong slip without a physical-tag check.

**Prototype:** Add a **Shift workspace** for the whole screening. It groups the three approved types, shows the actual unit tags and return status, and lets staff attach an expected custodian, return time, and note **to the outstanding slip**. On Saturday it surfaces that linked information as a prioritized queue. The receive action requires typing the matching physical tag before closing the loan; a mismatch leaves the loan open and displays an error.

This is intentionally a *workflow change*, not an unnecessary replacement of the app or an invented backend.

## Same job, before and after

| Moment | Existing workflow | Improved workflow |
| --- | --- | --- |
| Friday 3:45 pm — pickup | Open the request and create three separate issue slips in the register. | Same approved request and per-unit slips, plus a single kit checklist showing what's still missing. |
| Friday 7:30 pm — partial return | Mark projector/speaker slips returned; enter a separate text note about Leela. | Receive those exact tagged units in the workspace; add a handover *on `AD-12`* identifying Leela and Saturday 9 am. |
| Saturday 9 am — handover | Read the note, locate the request, find the still-open slip, decide which tag to close. | The workspace highlights `AD-12`, its custodian and expected time. Confirm the printed tag; `AD-15` is rejected. |

### Walk through the prototype

1. Start on **Shift workspace** at **Friday 3:45 pm**. Issue the projector `PR-04`, speaker `SP-02`, and adapter `AD-12` using the **Issue unit** buttons. Each action creates a regular loan slip. The screen should show **3/3 issued**.
2. Select **Move to return time**. Click **Receive** for `PR-04` and `SP-02`, enter each matching asset tag, and confirm. The display should show **2/3 returned, 1 outstanding**.
3. Select **Add handover** on `AD-12`. Save **Leela Das** as the holder and **Sat 9 am** as the expected return. The note is also visible in **Desk book** with its asset tag and slip ID.
4. Select **Move to next morning**. The priority block now tells the incoming worker **`AD-12` with Leela Das, expected Sat 9 am**. Select **Receive AD-12**; first try entering `AD-15` to see the safety check, then enter `AD-12` to close the correct slip.
5. Verify **3/3 returned** and **no outstanding Film Society units**. The individual slips are still visible under **Loan register → All slips**. Reload the page to verify saved progress. **Restart sample shift** resets the demo.

## Screenshots

Run `python tests/smoke_test.py` to generate `docs/partial-return.png`, `docs/morning-priority.png`, and `docs/mobile-desk-book.png` locally. The original prototype screenshots are available in the downloadable project archive shared with the candidate.

## What would prove this works at a real counter?

Observe five to ten real partial-return handovers, with staff consent and no personally identifying data in the study notes. Measure **time from the morning worker opening the desk to identifying the correct outstanding asset and acting on it**. Also count how often staff switch between registers or ask another worker for clarification, and any attempted wrong-tag closures. Compare the same task before and after the change, ideally counterbalancing which version participants use first.

**Success hypothesis:** Workers using the linked handover complete the identification and close-out task faster and make fewer unit-selection errors. This is a proposed test, **not** a claim that users have been studied or results measured. Ask participants whether the new checklist adds any unwanted overhead during a normal, complete return; faster morning handover should not make every pickup slower.

## Scope and trade-offs

- Kept: single-file vanilla JavaScript logic, plain HTML/CSS, offline use, sample records, approved-request checks, physical-unit loan slips, shelf/loan/repair inventory, desk messages, time controls, and the restart option.
- Added: screening kit overview, issue/received/outstanding counters, prefiltered issue flows, slip-linked handover details, morning priority panel, and physical asset-tag verification before return.
- Improved: responsive desktop/mobile styling, keyboard focus visibility, visible status/error messages, escaping of user-entered notes, persistent storage, and migration of the original `campus-stores.shift.v1` local state into v2.
- Deliberately not added: a backend, real authentication, notifications, barcode hardware, or automatic time-dependent returns. This is a self-contained work sample with fictional data. The shift clock is a scenario control, not actual wall-clock time.
- Known limitation: data remains in a single browser's local storage, without multi-user concurrency or an authoritative audit trail. A deployed campus product would need a backend, permissions, concurrency controls, and immutable receipt history.

## Run it

Open `index.html` directly in a modern browser, or serve this directory locally:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open `http://localhost:8000`. No npm install, external fonts, API keys, or network connections are needed.

To run the browser smoke test (Python Playwright and a local Chromium binary are required):

```sh
python tests/smoke_test.py
```

The smoke test exercises all three shift stages, wrong-tag rejection, local state restoration, and mobile rendering. `node --check app.js` checks JavaScript syntax.

## Project structure

- `index.html` — application layout and assignment brief
- `styles.css` — desktop/mobile layouts, forms, and status styles
- `app.js` — fictional records, loan workflows, handovers, persistence
- `docs/` — screenshots generated by the browser smoke test
- `tests/smoke_test.py` — interactive browser smoke test

## Submitting the exercise

Push the finished source to your **public fork** of [`virinchi-healthcare/campus-stores`](https://github.com/virinchi-healthcare/campus-stores). In that fork, open **Commits**, choose the final commit you want reviewers to see, and copy its GitHub URL. Submit that final commit URL along with your roll number and email address using [the form from the original assignment](https://docs.google.com/forms/d/e/1FAIpQLScvzoh1R4WS-SkiwAVBQbMvniieJYSoOEfLMyVo5CyjOvYUgQ/viewform). Enter personal details in the form only, not in this README.
