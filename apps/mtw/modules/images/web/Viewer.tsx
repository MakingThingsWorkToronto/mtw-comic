// Replaces the legacy <dialog id="viewer"> and "Open original" new-tab links (browser.js L136-139, L229, L288-293):
// the original opens in-app; the file itself stays one click away. Focus return and backdrop close come from Dialog.
import { Button } from '../../../web/ui/Button';
import { Dialog } from '../../../web/ui/Dialog';
import { copyText } from './common';
import { useHost } from './host';

export function Viewer({ title, path, onClose }: { title: string; path: string; onClose: () => void }) {
  const host = useHost();
  const src = host.data.file(path);
  const name = path.split('/').pop() ?? path;
  return (
    <Dialog
      title={title}
      wide
      onClose={onClose}
      footer={
        <>
          <span class="img-viewer-path" title={path}>
            {name}
          </span>
          <Button variant="ghost" help="Copies this file's location in the repo to your clipboard so you can paste it. Nothing is changed." onClick={() => void copyText(`wiki/image-library/${path}`)}>
            Copy path
          </Button>
          {host.data.reveal && (
            <Button variant="ghost" help="Shows this file in your computer's file explorer. Nothing is changed." onClick={() => void host.data.reveal?.(path)}>
              Reveal
            </Button>
          )}
          <a class="btn btn--secondary" href={src} title={host.mode === 'app' ? 'Saves a copy of this image to your Downloads folder. The library file is not changed.' : 'Opens this image file in a new browser tab. Nothing is changed.'} {...(host.mode === 'app' ? { download: name } : { target: '_blank', rel: 'noopener' })}>
            {host.mode === 'app' ? 'Download' : 'Open file'}
          </a>
        </>
      }
    >
      <div class="img-viewer">
        <img class="image-full" src={src} alt={title} />
      </div>
    </Dialog>
  );
}
