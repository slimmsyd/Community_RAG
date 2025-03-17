export type ResolvedAttestation = {
    name: string
    uid: string
    currAccount: string;
}

export type Profile = {
    id?: any
    author?: {
      id: string
    }
    name?: string
    username?: string
    description?: string
    gender?: string
    emoji?: string
}

export type Posts = {
    edges: Array<{
      node: {
        body: string
        id: string
      }
    }>
}

export type PostProps = { 
    profile: Profile
    body: string
    id: string
    tag?: string
    created?: string
    authorId?: string
}

export type SidebarProps = {
    name?: string
    username?: string
    id?: string
}

export type Author = {
    id: string
    name: string
    username: string
    emoji: string
}

type Post = {
    body: string
    id: string
    tag?: string
    created?: string
}

export type Session = {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    id?: string | null
  }
  expires: string
}

export interface AuthOptions {
  callbacks?: {
    session?: (params: { session: Session; user: any }) => Promise<Session>
    jwt?: (params: { token: any; user: any }) => Promise<any>
  }
  providers: Array<any>
}