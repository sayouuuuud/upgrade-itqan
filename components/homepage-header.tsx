"use client"

import useSWR from "swr"
import HeaderNavClient from "./homepage-header-client"

type AuthStatus = {
  authenticated: boolean
  user?: { role: string; name: string }
  dashboardLink?: string
  dashboardText?: string
}

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.json() : { authenticated: false }))

export default function HomepageHeader() {
  const { data } = useSWR<AuthStatus>("/api/auth/status", fetcher, {
    revalidateOnFocus: false,
  })

  const isLoggedIn = !!data?.authenticated

  return (
    <HeaderNavClient
      isLoggedIn={isLoggedIn}
      dashboardLink={isLoggedIn ? (data?.dashboardLink ?? "/dashboard") : null}
      dashboardText={isLoggedIn ? (data?.dashboardText ?? "My Account") : null}
      userName={data?.user?.name}
    />
  )
}
