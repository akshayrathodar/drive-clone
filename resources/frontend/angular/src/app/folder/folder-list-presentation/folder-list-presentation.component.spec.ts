import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderListPresentationComponent } from './Folder-list-presentation.component';

describe('FolderListPresentationComponent', () => {
  let component: FolderListPresentationComponent;
  let fixture: ComponentFixture<FolderListPresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FolderListPresentationComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FolderListPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
