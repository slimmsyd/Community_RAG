import { Share2, Facebook, Twitter, BookOpen, Clock, FileText, Users, Network, Lock, Heart, History } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Article() {
    return (
        <main className="min-h-screen bg-white text-black">
            {/* Hero Image Section */}
            <div className="relative w-full h-[70vh] mb-12">
                <Image
                    src="/home/WomenSave.png"
                    alt="Preserving Her Story"
                    fill
                    className="object-cover object-center"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
            </div>

            {/* Content Container */}
            <div className="relative -mt-32">
                {/* Article Header */}
                <header className="max-w-[900px] mx-auto px-4 pt-8 md:pt-16 relative z-10">
                    {/* Categories */}
                    <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
                        <Link href="/legacy" className="text-blue-600 hover:underline bg-white/90 px-3 py-1 rounded-full backdrop-blur-sm">Legacy</Link>
                        <span className="text-gray-500">•</span>
                        <Link href="/family-history" className="text-blue-600 hover:underline bg-white/90 px-3 py-1 rounded-full backdrop-blur-sm">Family History</Link>
                        <span className="text-gray-500">•</span>
                        <Link href="/blockchain" className="text-blue-600 hover:underline bg-white/90 px-3 py-1 rounded-full backdrop-blur-sm">Blockchain</Link>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 text-black bg-white/95 p-8 rounded-2xl backdrop-blur-sm shadow-sm">
                        Preserving Her-Story: A Digital Legacy for Future Generations
                    </h1>

                    {/* Author Info & Publish Date */}
                    <div className="flex items-center gap-4 mb-8 bg-white/95 p-6 rounded-xl backdrop-blur-sm shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12">
                                <Image
                                    src="/avatars/author.png"
                                    alt="Author"
                                    fill
                                    className="rounded-full object-cover ring-2 ring-white"
                                />
                            </div>
                            <div>
                                <p className="font-medium text-black">RememberTheLineage</p>
                                <p className="text-sm text-gray-600">Family Legacy Platform</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 border-l pl-4">
                            <p>Published</p>
                            <p>2024</p>
                        </div>
                    </div>
                </header>

                {/* Article Content */}
                <article className="max-w-[900px] mx-auto px-4">
                    {/* Opening Quote */}
                    <div className="mb-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                        <p className="text-xl text-blue-900 leading-relaxed italic">
                            "I don't know about you, but I was often told 'his-story' never much told 'her-story'. Now it may seem that we are getting into the grammatical structure of things, though don't let the surface level view of language fool you to not feel the magnitude and reach of that statement."
                        </p>
                    </div>

                    {/* Main Content */}
                    <div className="prose prose-lg max-w-none prose-headings:text-black prose-p:text-gray-800">
                        {/* Mission Section */}
                        <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
                            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                            <p className="mb-6">
                                Our goal for this RememberTheLineage application is to democratize a safe immutable place for all families to be able to store their precious family moments in the digital landscape. We find our approach to be quite different using blockchain technology to store your identities on-chain in a tamper-proof environment grants you the family(ies) a safe place of storage for generations to come.
                            </p>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 my-8">
                                <p className="text-xl font-semibold text-blue-900 mb-4">
                                    Our application empowers families to:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white/80 p-4 rounded-xl text-center">
                                        <Heart className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                        <span className="font-bold text-blue-800 block">Preserve</span>
                                        <span className="text-sm text-blue-600">Family Memories</span>
                                    </div>
                                    <div className="bg-white/80 p-4 rounded-xl text-center">
                                        <History className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                        <span className="font-bold text-blue-800 block">Organize</span>
                                        <span className="text-sm text-blue-600">Historical Legacy</span>
                                    </div>
                                    <div className="bg-white/80 p-4 rounded-xl text-center">
                                        <Share2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                        <span className="font-bold text-blue-800 block">Share</span>
                                        <span className="text-sm text-blue-600">Family Stories</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* The Challenge Section */}
                        <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
                            <h2 className="text-3xl font-bold mb-6">The Challenge</h2>
                            <p className="mb-6">
                                There are individuals and families and whole cultures out there that can't tell you who their great great grandmother is. Due to no safe storage or recollection, and other outside external factors that may have lead to the destruction of those records. This leads to a disconnect from the whole, a leads to a period of time where the individual will battle against a lost of identity, a lost of place within society, within the community, within the family, and most importantly within the self.
                            </p>
                            <div className="bg-gray-50 p-6 rounded-xl my-6">
                                <p className="text-lg text-gray-800">
                                    This platform aims to create a lasting legacy. Ensuring that your stories and memories are passed down, so that your predecessors will always have a connection to a past, not a fragmented one, but a wholistic one the great, good, bad, and ugly to understand the family identity.
                                </p>
                            </div>
                        </div>

                        {/* Building Connections Section */}
                        <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
                            <h2 className="text-3xl font-bold mb-6">Building Lasting Connections</h2>
                            <p className="mb-6">
                                With a platform such as this, the individual gets to build a sense of connection to their family history, knowing about their ancestor's lives, struggles, triumphs, creating a feeling of belonging and a deeper understanding of their roots. To add understands the family identity, by seeing patterns of occupation, achievements, and locations can help future generations understand their family identity, thus granting a long term memory perseveration mechanism.
                            </p>
                            <p className="mb-6">
                                Which then begets a family legacy visualizer and enhanced family management. How? our platforms ability to categorize and organize family members with AI enhances the accessibility of family information for future generations, making it easier for them to navigate and utilize these records.
                            </p>
                        </div>

                        {/* Platform Features */}
                        <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-8 mb-12">
                            <h2 className="text-3xl font-bold mb-8">Platform Features</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Users className="w-6 h-6 text-blue-600" />
                                        <h3 className="text-xl font-bold">Profile Creation Portal</h3>
                                    </div>
                                    <p>Create profiles for each family member, enabling the compilation of individual histories and details within a larger family context.</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Clock className="w-6 h-6 text-blue-600" />
                                        <h3 className="text-xl font-bold">Chronological Timeline</h3>
                                    </div>
                                    <p>Track life events and significant moments with a chronological timeline of documents for each family member.</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                        <h3 className="text-xl font-bold">Historical Document Integration</h3>
                                    </div>
                                    <p>Incorporate vital records and historical materials to enrich each family member's profile with authentic documentation.</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                        <h3 className="text-xl font-bold">AI-Driven Categorization</h3>
                                    </div>
                                    <p>Advanced AI automatically organizes and groups family members based on relationships, generations, and custom criteria.</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Network className="w-6 h-6 text-blue-600" />
                                        <h3 className="text-xl font-bold">Relationship-mapping</h3>
                                    </div>
                                    <p>Interactive family tree visualization that enhances understanding of connections within the family.</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Lock className="w-6 h-6 text-blue-600" />
                                        <h3 className="text-xl font-bold">Blockchain Technology</h3>
                                    </div>
                                    <p>Secure, immutable storage ensures your family memories are protected and preserved for future generations.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>

                {/* Call to Action Footer */}
                <footer className="max-w-[900px] mx-auto px-4 py-12 mt-12">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Begin Your Family's Legacy Journey</h3>
                                <p className="text-blue-100">Create a lasting connection between past, present, and future generations.</p>
                            </div>
                            <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
                                Start Preserving
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    )
}