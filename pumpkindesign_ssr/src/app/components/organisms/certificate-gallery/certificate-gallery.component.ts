import { Component, input } from '@angular/core';

@Component({
  selector: 'lpd-certificate-gallery',
  imports: [],
  templateUrl: './certificate-gallery.component.html',
  styleUrl: './certificate-gallery.component.scss',
})
export class CertificateGalleryComponent {
  certificate = input<any>(); // TODO change any to Certificate interface
}
