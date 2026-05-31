import { Component, input } from '@angular/core';
import { LinkComponent } from '../../molecules/link/link.component';

@Component({
  selector: 'lpd-certificate-gallery',
  imports: [LinkComponent],
  templateUrl: './certificate-gallery.component.html',
  styleUrl: './certificate-gallery.component.scss',
})
export class CertificateGalleryComponent {
  certificate = input<any>(); // TODO change any to Certificate interface
}
