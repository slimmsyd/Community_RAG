'use client';

import { useState, useEffect } from 'react';
import { ResourceCategory, ResourceSection } from '@/app/dashboard/types';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { RightDashboard } from '@/components/RightDashboard';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
interface Resource {
  _id: string;
  link: string;
  submitted_by: {
    user_id: string;
    username: string;
  };
  timestamp: Date;
  upvotes: number;
  tags: string[];
  auto_tagged: boolean;
}

export default function ResourcesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const [sections, setSections] = useState<ResourceSection[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/resources');
      const data = await response.json();

      console.log("DATA DATA DATA", data);

      if (data.success) {
        setCategories(data.categories);
        // Create a Set to track unique links
        const seenLinks = new Set();
        // Group resources by category (tag) and filter duplicates
        const resourcesByCategory = data.categories
          .map((category: ResourceCategory) => ({
            category,
            resources: data.resources
              .filter((r: Resource) => {
                if (r.tags?.includes(category)) {
                  // Check if we've seen this link before
                  if (seenLinks.has(r.link)) {
                    return false; // Skip duplicate links
                  }
                  seenLinks.add(r.link);
                  return true;
                }
                return false;
              }) || [],
            isOpen: false
          }))
          // Filter out categories with zero resources
          .filter((section: ResourceSection) => section.resources.length > 0);
        setSections(resourcesByCategory);
      } else {
        setError('Failed to fetch resources');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('An error occurred while fetching resources');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  const toggleSection = (category: ResourceCategory) => {
    setSections(prev =>
      prev.map(section =>
        section.category === category
          ? { ...section, isOpen: !section.isOpen }
          : section
      )
    );
  };

  if (!mounted) return null;

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      {/* Left Sidebar */}
        <DashboardSidebar
          activePage="resources"
          onNavigate={handleNavigation}
          userName={session?.user?.name || "User"}
          userAvatar={session?.user?.image || ""}
        />

      <ResizableHandle />

      {/* Main Content */}
      <ResizablePanel defaultSize={55}>
        <div className="h-full bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
              <Button
                onClick={() => {/* TODO: Add resource modal */}}
                className="flex items-center gap-2"
              >
                {/* <Plus className="w-4 h-4" />
                Add Resource */}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">
                {error}
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.category}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(section.category)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl font-semibold text-gray-900">
                          {section.category}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          ({section.resources.length} resources)
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: section.isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {section.isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="border-t border-gray-200">
                            {section.resources.length === 0 ? (
                              <div className="px-6 py-8 text-center text-gray-500">
                                <p>No resources added yet in this category.</p>
                                <Button
                                  variant="link"
                                  onClick={() => {/* TODO: Add resource modal */}}
                                  className="mt-2"
                                >
                                  Add the first resource
                                </Button>
                              </div>
                            ) : (
                              section.resources.map((resource) => (
                                <div
                                  key={resource._id}
                                  className="px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200"
                                >
                                  <a
                                    href={resource.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block group"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <Link href={resource.link} className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                          {resource.title}
                                        </Link>
                                        <div className="mt-2 flex items-center space-x-4">
                                          <span className="text-xs text-gray-400">
                                            Submitted by {resource.submitted_by.username}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            {new Date(resource.timestamp).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">
                                          {resource.upvotes} upvotes
                                        </span>
                                        {resource.auto_tagged && (
                                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                            AI Tagged
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle />

      {/* Right Sidebar */}
      {/* <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
        <RightDashboard
          userName={session?.user?.name || "User"}
          userAvatar={session?.user?.image || ""}
          userRole="Member"
          familyMemberCount={0}
          onInvite={() => {}}
          onSendMessage={() => {}}
        />
      </ResizablePanel> */}
    </ResizablePanelGroup>
  );
} 