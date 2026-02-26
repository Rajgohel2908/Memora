import { Error404 } from '../components/ui/pixelated-404-not-found';
import PageTransition from '../components/PageTransition';

export default function NotFound() {
    return (
        <PageTransition>
            <Error404
                postcardImage="/memora-postcard.png"
                postcardAlt="Memora — Memories Lost in Time"
                curvedTextTop="Memora — Your Story"
                curvedTextBottom="Beautifully Preserved"
                heading="(404) Looks like this memory got lost somewhere in time."
                subtext="But hey — even the unexpected detours lead to beautiful discoveries."
                backButtonLabel="Back to Home"
                backButtonHref="/"
            />
        </PageTransition>
    );
}
