package com.nowen.note;

import android.content.Context;
import android.util.AttributeSet;
import android.view.ActionMode;
import android.view.Menu;
import android.view.MenuItem;
import com.getcapacitor.CapacitorWebView;

public class NoSelectionActionModeWebView extends CapacitorWebView {
    public NoSelectionActionModeWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    public ActionMode startActionMode(ActionMode.Callback callback) {
        return super.startActionMode(new NoSelectionMenuCallback(callback));
    }

    @Override
    public ActionMode startActionMode(ActionMode.Callback callback, int type) {
        return super.startActionMode(new NoSelectionMenuCallback(callback), type);
    }

    private static class NoSelectionMenuCallback implements ActionMode.Callback {
        private final ActionMode.Callback delegate;

        NoSelectionMenuCallback(ActionMode.Callback delegate) {
            this.delegate = delegate;
        }

        @Override
        public boolean onCreateActionMode(ActionMode mode, Menu menu) {
            boolean created = delegate == null || delegate.onCreateActionMode(mode, menu);
            menu.clear();
            return created;
        }

        @Override
        public boolean onPrepareActionMode(ActionMode mode, Menu menu) {
            boolean prepared = delegate != null && delegate.onPrepareActionMode(mode, menu);
            menu.clear();
            return prepared;
        }

        @Override
        public boolean onActionItemClicked(ActionMode mode, MenuItem item) {
            return true;
        }

        @Override
        public void onDestroyActionMode(ActionMode mode) {
            if (delegate != null) {
                delegate.onDestroyActionMode(mode);
            }
        }
    }
}
