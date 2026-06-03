import { Component, input } from '@angular/core';
import { Image } from '../../../interfaces/atom.interface';
@Component({
    selector: 'lpd-image',
    imports: [],
    templateUrl: './image.component.html',
    styleUrl: './image.component.scss'
})
export class ImageComponent {
    image = input<Image>();
}
