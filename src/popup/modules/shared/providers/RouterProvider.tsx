import { RouterProvider as ReactRouterProvider } from 'react-router'
import { useRef } from 'react'
import { container } from 'tsyringe'

import { Router } from '../models'

interface Props {
    router: Router;
}

export function RouterProvider({ router }: Props) {
    const ref = useRef(false)

    if (!ref.current) {
        ref.current = true
        container.registerInstance(Router, router)
    }

    return (
        <ReactRouterProvider router={router} />
    )
}
