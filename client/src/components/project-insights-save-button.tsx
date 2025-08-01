import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useProjectInsights } from "@/hooks/use-project-insights";
import { useToast } from "@/hooks/use-toast";
import type { ProjectInsights } from "@shared/insights-schema";

interface ProjectInsightsSaveButtonProps {
  projectId: string;
  projectName: string;
  projectPath?: string;
  onSaveComplete?: () => void;
}

export function ProjectInsightsSaveButton({ 
  projectId, 
  projectName, 
  projectPath,
  onSaveComplete 
}: ProjectInsightsSaveButtonProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectName: projectName,
    description: "",
    projectType: "",
    framework: "",
    language: "",
    runCommand: "",
    buildCommand: "",
    testCommand: "",
    notes: "",
  });

  const { toast } = useToast();
  const { insights, saveInsights, isSaving, saveSuccess } = useProjectInsights(projectId, projectPath);

  const handleSave = () => {
    const insightsData: Partial<ProjectInsights> = {
      projectName: formData.projectName,
      description: formData.description,
      projectType: formData.projectType,
      framework: formData.framework,
      language: formData.language,
      runCommand: formData.runCommand,
      buildCommand: formData.buildCommand || undefined,
      testCommand: formData.testCommand || undefined,
      recommendations: formData.notes ? [formData.notes] : undefined,
    };

    saveInsights(insightsData);
  };

  // Update form data when insights load
  React.useEffect(() => {
    if (insights) {
      setFormData({
        projectName: insights.projectName || projectName,
        description: insights.description || "",
        projectType: insights.projectType || "",
        framework: insights.framework || "",
        language: insights.language || "",
        runCommand: insights.runCommand || "",
        buildCommand: insights.buildCommand || "",
        testCommand: insights.testCommand || "",
        notes: insights.recommendations?.join(", ") || "",
      });
    }
  }, [insights, projectName]);

  // Handle save success
  React.useEffect(() => {
    if (saveSuccess) {
      toast({
        title: "Project insights saved",
        description: "The insightsproject.ia file has been updated with project information.",
      });
      setOpen(false);
      onSaveComplete?.();
    }
  }, [saveSuccess, toast, onSaveComplete]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Save Project</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Save Project Insights</span>
          </DialogTitle>
          <DialogDescription>
            Save project metadata and context to insightsproject.ia file for better AI assistance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Project Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  placeholder="My Project"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Input
                  id="projectType"
                  value={formData.projectType}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                  placeholder="web-app, cli-tool, library"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your project..."
                rows={2}
              />
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Technical Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="framework">Framework</Label>
                <Input
                  id="framework"
                  value={formData.framework}
                  onChange={(e) => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                  placeholder="React, Next.js, Django, Express"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  placeholder="JavaScript, TypeScript, Python, Java"
                />
              </div>
            </div>
          </div>

          {/* Commands */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Commands</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="runCommand">Run Command</Label>
                <Input
                  id="runCommand"
                  value={formData.runCommand}
                  onChange={(e) => setFormData(prev => ({ ...prev, runCommand: e.target.value }))}
                  placeholder="npm start, python main.py, java -jar app.jar"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buildCommand">Build Command (Optional)</Label>
                  <Input
                    id="buildCommand"
                    value={formData.buildCommand}
                    onChange={(e) => setFormData(prev => ({ ...prev, buildCommand: e.target.value }))}
                    placeholder="npm run build, make, gradle build"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testCommand">Test Command (Optional)</Label>
                  <Input
                    id="testCommand"
                    value={formData.testCommand}
                    onChange={(e) => setFormData(prev => ({ ...prev, testCommand: e.target.value }))}
                    placeholder="npm test, pytest, mvn test"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Notes</h3>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes & Recommendations</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special setup instructions, dependencies, or notes for AI assistance..."
                rows={3}
              />
            </div>
          </div>

          {/* File Path Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Save Location</p>
                <p>Will be saved as: <code className="text-xs bg-blue-100 dark:bg-blue-800 px-1 rounded">
                  {projectPath || "."}/insightsproject.ia
                </code></p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.projectName.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saveSuccess && <CheckCircle className="h-4 w-4 mr-2" />}
              Save Project Insights
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}