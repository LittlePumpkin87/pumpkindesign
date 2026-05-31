import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
    selector: 'lpd-timeline',
    imports: [CommonModule],
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent {
  timeline = input<any[]>(); // TODO change any to TimelineItem interface
}
