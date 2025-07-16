import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";

const DataManagementModal = ({
  open,
  onOpenChange,
  title,
  description,
  leftColumn,
  rightColumn,
}) => {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Form */}
          {leftColumn}

          {/* Right Column - Ingredients / Meals List */}
          {rightColumn}
        </div>
      </DialogContent>
    </Dialog>
  )
};

export default DataManagementModal;