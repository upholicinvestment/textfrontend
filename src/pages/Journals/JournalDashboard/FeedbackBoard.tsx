
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE, getUserId } from "../../../api";

const AUTH_TOKEN_KEYS = ["accessToken", "token", "jwt", "authToken"];
const getAuthToken = () => {
  for (const k of AUTH_TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
};
const authHeaders = () => {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

type Item = {
  _id: string;
  title: string;
  details?: string;
  tags: string[];
  votes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  user?: { id?: string | null; name?: string | null } | null;
};

type ListResp = { items: Item[]; total: number; page: number; pages: number };

const tagColors: Record<string, string> = {
  bug: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30",
  feature: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
  ui: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/30",
  export: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
  other: "bg-purple-500/15 text-purple-300 ring-1 ring-purple-400/30",
  default: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/30",
};

const Chip = ({ tag }: { tag: string }) => {
  const colorClass = tagColors[tag] || tagColors.default;
  return (
    <span
      key={tag}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${colorClass}`}
    >
      {tag}
    </span>
  );
};

const FeedbackBoard: React.FC = () => {
  const [sort, setSort] = useState<"trending" | "new" | "top">("trending");
  const [tag, setTag] = useState<string>("all");
  const [q, setQ] = useState<string>("");
  const [page, setPage] = useState(1);

  const [list, setList] = useState<ListResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // create form
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [tags, setTags] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const uid = useMemo(() => getUserId?.() || null, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const url = new URL(`${API_BASE}/feedback`);
      url.searchParams.set("sort", sort);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "10");
      if (tag && tag !== "all") url.searchParams.set("tag", tag);
      if (q.trim()) url.searchParams.set("q", q.trim());

      const { data } = await axios.get<ListResp>(url.toString(), {
        withCredentials: true,
      });
      setList(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setList(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, tag, q, page]);

  async function submit() {
    setFormError(null);

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!tags.trim()) {
      setFormError("Please select a tag.");
      return;
    }

    try {
      const postUrl = new URL(`${API_BASE}/feedback`);
      if (uid) postUrl.searchParams.set("userId", uid);
      await axios.post(
        postUrl.toString(),
        { title: title.trim(), details: details.trim(), tags: tags.trim() },
        { withCredentials: true, headers: authHeaders() }
      );
      setTitle("");
      setDetails("");
      setTags("");
      setIsFormOpen(false);
      setPage(1);
      await load();
    } catch (e: any) {
      setFormError(e?.message || "Failed to submit");
    }
  }

  async function upvote(id: string, hasVoted: boolean) {
    try {
      const url = new URL(`${API_BASE}/feedback/${id}/vote`);
      if (uid) url.searchParams.set("userId", uid);
      if (hasVoted) {
        await axios.delete(url.toString(), {
          withCredentials: true,
          headers: authHeaders(),
        });
      } else {
        await axios.put(
          url.toString(),
          {},
          { withCredentials: true, headers: authHeaders() }
        );
      }
      await load();
    } catch (e: any) {
      alert(e?.message || "Vote failed");
    }
  }

  const tagOptions = [
    { value: "all", label: "All Tags" },
    { value: "bug", label: "Bug" },
    { value: "feature", label: "Feature" },
    { value: "ui", label: "UI/UX" },
    { value: "export", label: "Export" },
    { value: "other", label: "Other" },
  ];

  // ---- Null-safe items array for rendering ----
  const items: Item[] = Array.isArray(list?.items) ? list!.items : [];

  return (
    <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-700 shadow-xl">
      {/* Container: responsive padding & centered width */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Feedback & Suggestions</h2>
          <p className="text-sm text-slate-400 mt-1">
            Share issues, feature ideas, and upvote what matters most to you.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
          <select
            className="w-full sm:w-auto px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as any);
              setPage(1);
            }}
          >
            <option value="trending">Trending</option>
            <option value="new">Newest</option>
            <option value="top">Most Votes</option>
          </select>

          {/* Tag Dropdown */}
          <div className="relative w/full sm:w-auto">
            <select
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none pr-8"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setPage(1);
              }}
            >
              {tagOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative w-full sm:ml-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              className="pl-10 pr-3 py-2 w-full text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Search feedback..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Create Button */}
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full mb-6 p-4 rounded-lg border border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-300">Share your feedback or suggestion</span>
            </div>
            <span className="text-xs text-slate-500 mt-2 sm:mt-0">Click to create a new post</span>
          </button>
        )}

        {/* Create Form */}
        {isFormOpen && (
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">New Feedback</h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close form"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                  placeholder="Brief, descriptive title (e.g., 'Allow exporting script summary as CSV')"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Details</label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none min-h-[100px]"
                  placeholder="Provide more context, details, or examples (optional)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tags *</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none pr-8"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  >
                    <option value="">Select a tag</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="ui">UI/UX</option>
                    <option value="export">Export</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Select a tag to categorize your feedback</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit Feedback
                </button>
              </div>

              {formError && (
                <div className="mt-3 text-sm text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-slate-400">Loading feedback...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-300 mb-1">No feedback yet</h3>
            <p className="text-slate-500 text-sm">Be the first to share your thoughts and suggestions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((it) => {
              const created = it.createdAt ? new Date(it.createdAt).toLocaleDateString() : "";
              const hasVoted = false;

              // ---- Null-safe tags (handles array | string | null | undefined) ----
              const safeTags =
                Array.isArray(it.tags)
                  ? it.tags
                  : typeof (it as any).tags === "string" && (it as any).tags.trim()
                    ? (it as any).tags.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : [];

              return (
                <div
                  key={it._id}
                  className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 sm:p-5 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <button
                      onClick={() => upvote(it._id, hasVoted)}
                      className={`shrink-0 flex flex-col items-center justify-center w-10 h-12 sm:w-12 sm:h-12 rounded-lg ${
                        hasVoted
                          ? "bg-indigo-600 text-white ring-1 ring-indigo-500/50"
                          : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 ring-1 ring-slate-600/60"
                      } transition-colors`}
                      title="Upvote"
                      aria-label="Upvote"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span className="text-xs sm:text-sm font-semibold mt-0.5">{it.votes ?? 0}</span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 break-words">
                        {it.title}
                      </h3>

                      {it.details && (
                        <p
                          className="text-slate-300/90 text-sm mb-3 whitespace-pre-wrap break-all overflow-hidden line-clamp-2"
                          title={it.details}
                        >
                          {it.details}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-2">
                        {safeTags.map((tg: string) => (
                          <Chip key={tg} tag={tg} />
                        ))}
                      </div>

                      <div className="text-[11px] sm:text-xs text-slate-500">Posted {created}</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pager */}
            {(list?.pages ?? 1) > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-slate-800/80">
                <div className="text-sm text-slate-400">
                  Showing {items.length} of {list?.total ?? 0} items • Page {list?.page ?? 1} of {list?.pages ?? 1}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setPage((p) => Math.min(list?.pages ?? 1, p + 1))}
                    disabled={page >= (list?.pages ?? 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {err && (
          <div className="mt-4 text-sm text-rose-300/90 bg-rose-500/10 border border-rose-400/30 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackBoard;