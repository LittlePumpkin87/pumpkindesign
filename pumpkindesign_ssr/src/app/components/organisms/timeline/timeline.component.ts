import { Component, input } from '@angular/core';
import { TimelineItem } from '../../../interfaces/organism.interface';

// Schlichte, einspaltige Lebenslauf-Timeline: alle Inhalte sind ohne
// Interaktion sichtbar.

@Component({
  selector: 'lpd-timeline',
  imports: [],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
})
export class TimelineComponent {
  items = input<TimelineItem[]>([]);
}
