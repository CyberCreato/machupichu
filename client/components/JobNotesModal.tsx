import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Job } from "@shared/types";
import { Loader2, Plus, Clock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface JobNote {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface JobNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onNotesUpdated: () => void;
}

export function JobNotesModal({
  open,
  onOpenChange,
  job,
  onNotesUpdated,
}: JobNotesModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<JobNote[]>([]);

  useEffect(() => {
    if (open && job) {
      fetchNotes();
      setNewNote("");
      setError(null);
    }
  }, [open, job]);

  const fetchNotes = async () => {
    if (!job) return;

    setNotesLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`/api/jobs/${job.id}/notes`, { headers });

      if (response.ok) {
        const notesData = await response.json();
        setNotes(notesData);
      } else {
        // If endpoint doesn't exist, initialize empty notes
        setNotes([]);
      }
    } catch (error) {
      console.warn("Could not fetch notes:", error);
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !newNote.trim() || !user) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${job.id}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: newNote.trim(),
        }),
      });

      if (response.ok) {
        const newNoteData = await response.json();
        setNotes((prev) => [newNoteData, ...prev]);
        setNewNote("");
        onNotesUpdated();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add note");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Invalid date";

    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (!job) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Notes</DialogTitle>
          <DialogDescription>
            Add notes and track progress for: {job.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Note */}
          <form onSubmit={handleAddNote} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newNote">Add Note</Label>
              <Textarea
                id="newNote"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here..."
                className="min-h-[100px]"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button type="submit" disabled={loading || !newNote.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Note
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Previous Notes</h3>
              <Badge variant="outline">{notes.length} notes</Badge>
            </div>

            {notesLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Clock className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-gray-600">No notes yet</p>
                <p className="text-sm text-gray-500">
                  Add the first note to track progress
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-sm">
                            {note.createdByName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
